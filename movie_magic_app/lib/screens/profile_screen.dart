import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:image_picker/image_picker.dart';
import 'package:movie_magic_app/services/user_service.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'user_list_screen.dart';
import 'movie_list_screen.dart';
import 'create_edit_list_screen.dart';
import 'list_details_screen.dart';

class ProfileScreen extends StatefulWidget {
  final String userId;

  const ProfileScreen({super.key, required this.userId});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _profileData;
  List<dynamic> _reviews = [];
  List<dynamic> _lists = [];
  bool _isLoading = true;
  bool _isFollowing = false;
  late int _followersCount;
  final _currentUserId = Supabase.instance.client.auth.currentUser?.id;

  // Controllers for editing
  late final _usernameController = TextEditingController();
  late final _bioController = TextEditingController();
  String? _avatarUrl;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() {
      _isLoading = true;
    });
    await _fetchProfile();
    await _fetchReviews();
    await _fetchLists();
    if (_currentUserId != null && _currentUserId != _profileData!['id']) {
      await _checkIfFollowing();
    }
    if (mounted) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchProfile() async {
    try {
      final profileData = await UserService.getUserProfile(widget.userId);
      if (mounted) {
        setState(() {
          _profileData = profileData;
          _followersCount = _profileData!['followers_count'] ?? 0;
          _avatarUrl = _profileData!['avatar_url'];
          _usernameController.text = _profileData!['username'];
          _bioController.text = _profileData!['bio'];
        });
      }
    } catch (e) {
      print('Error fetching profile: $e');
    }
  }

  Future<void> _fetchReviews() async {
    try {
      final reviews = await UserService.getUserReviews(widget.userId);
      if (mounted) {
        setState(() {
          _reviews = reviews;
        });
      }
    } catch (e) {
      print('Error fetching reviews: $e');
    }
  }

  Future<void> _fetchLists() async {
    try {
      final lists = await UserService.getUserLists(widget.userId);
      if (mounted) {
        setState(() {
          _lists = lists;
        });
      }
    } catch (e) {
      print('Error fetching lists: $e');
    }
  }

  Future<void> _checkIfFollowing() async {
    try {
      final isFollowing = await UserService.isFollowing(widget.userId);
      if (mounted) {
        setState(() {
          _isFollowing = isFollowing;
        });
      }
    } catch (e) {
      print('Error checking if following: $e');
    }
  }

  Future<void> _toggleFollow() async {
    try {
      await UserService.toggleFollow(widget.userId);
      if (mounted) {
        setState(() {
          _isFollowing = !_isFollowing;
          if (_isFollowing) {
            _followersCount++;
          } else {
            _followersCount--;
          }
        });
      }
    } catch (e) {
      print('Error toggling follow: $e');
    }
  }

  Future<void> _updateProfile() async {
    final username = _usernameController.text.trim();
    final bio = _bioController.text.trim();

    try {
      await UserService.updateUserProfile(_currentUserId!, username, bio);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile updated successfully!')),
        );
        setState(() {
          _profileData!['username'] = username;
          _profileData!['bio'] = bio;
        });
        Navigator.of(context).pop(); // Close the dialog
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error updating profile: $e')),
        );
      }
    }
  }

  Future<void> _uploadAvatar() async {
    final picker = ImagePicker();
    final imageFile = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 300,
      maxHeight: 300,
    );
    if (imageFile == null) return;

    final croppedFile = await ImageCropper().cropImage(
      sourcePath: imageFile.path,
      uiSettings: [
        AndroidUiSettings(
            toolbarTitle: 'Crop Image',
            toolbarColor: Theme.of(context).primaryColor,
            toolbarWidgetColor: Colors.white,
            initAspectRatio: CropAspectRatioPreset.square,
            lockAspectRatio: true),
        IOSUiSettings(
          title: 'Crop Image',
          aspectRatioLockEnabled: true,
        ),
      ],
    );

    if (croppedFile == null) return;

    setState(() => _isLoading = true);

    try {
      final bytes = await croppedFile.readAsBytes();
      final fileExt = croppedFile.path.split('.').last;

      final imageUrl = await UserService.uploadAvatar(_currentUserId!, bytes, fileExt);

      setState(() {
        _avatarUrl = imageUrl;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Avatar updated!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error uploading avatar: $e')),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showEditProfileDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Edit Profile'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextFormField(
              controller: _usernameController,
              decoration: const InputDecoration(labelText: 'Username'),
            ),
            TextFormField(
              controller: _bioController,
              decoration: const InputDecoration(labelText: 'Bio'),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: _updateProfile,
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  Future<void> _signOut() async {
    await Supabase.instance.client.auth.signOut();
    if (mounted) {
      Navigator.of(context).pushReplacementNamed('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading || _profileData == null) {
      return const Scaffold(
        appBar: AppBar(),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final isCurrentUser = _currentUserId == _profileData!['id'];

    return Scaffold(
      appBar: AppBar(
        title: Text(_profileData!['username'] ?? 'Profile'),
        actions: [
          if (isCurrentUser)
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: _showEditProfileDialog,
            ),
          if (isCurrentUser)
            IconButton(
              icon: const Icon(Icons.logout),
              onPressed: _signOut,
            ),
          if (!isCurrentUser)
            TextButton(
              onPressed: _toggleFollow,
              child: Text(_isFollowing ? 'Unfollow' : 'Follow'),
            ),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  InkWell(
                    onTap: isCurrentUser ? _uploadAvatar : null,
                    child: CircleAvatar(
                      radius: 40,
                      backgroundImage: _avatarUrl != null && _avatarUrl!.isNotEmpty
                          ? NetworkImage(_avatarUrl!)
                          : null,
                      child: _avatarUrl == null || _avatarUrl!.isEmpty
                          ? const Icon(Icons.person, size: 40)
                          : null,
                    ),
                  ),
                  const SizedBox(width: 20),
                  Expanded(
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            GestureDetector(
                              onTap: () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => UserListScreen(
                                    userId: _profileData!['id'] as String,
                                    listType: UserListType.followers,
                                  ),
                                ),
                              ),
                              child: Column(
                                children: [
                                  Text(
                                    _followersCount.toString(),
                                    style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16),
                                  ),
                                  const Text('Followers'),
                                ],
                              ),
                            ),
                            GestureDetector(
                              onTap: () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => UserListScreen(
                                    userId: _profileData!['id'] as String,
                                    listType: UserListType.following,
                                  ),
                                ),
                              ),
                              child: Column(
                                children: [
                                  Text(
                                    (_profileData!['following_count'] ?? 0)
                                        .toString(),
                                    style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16),
                                  ),
                                  const Text('Following'),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            GestureDetector(
                              onTap: () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => MovieListScreen(
                                    userId: _profileData!['id'] as String,
                                    listType: MovieListType.watchlist,
                                  ),
                                ),
                              ),
                              child: Column(
                                children: [
                                  Text(
                                    (_profileData!['watchlist_count'] ?? 0)
                                        .toString(),
                                    style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16),
                                  ),
                                  const Text('Watchlist'),
                                ],
                              ),
                            ),
                            GestureDetector(
                              onTap: () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => MovieListScreen(
                                    userId: _profileData!['id'] as String,
                                    listType: MovieListType.favorite,
                                  ),
                                ),
                              ),
                              child: Column(
                                children: [
                                  Text(
                                    (_profileData!['favorites_count'] ?? 0)
                                        .toString(),
                                    style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16),
                                  ),
                                  const Text('Favorites'),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (_profileData!['bio'] != null &&
                  _profileData!['bio'].isNotEmpty) ...[
                const Text(
                  'Bio',
                  style: TextStyle(
                    fontSize: 18.0,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8.0),
                Text(_profileData!['bio']),
                const SizedBox(height: 16),
              ],
              const Text(
                'Lists',
                style: TextStyle(
                  fontSize: 18.0,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8.0),
              if (_lists.isEmpty)
                const Text('No lists yet.')
              else
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _lists.length,
                  itemBuilder: (context, index) {
                    final list = _lists[index];
                    return Card(
                      margin: const EdgeInsets.symmetric(vertical: 4.0),
                      child: ListTile(
                        title: Text(list['name']),
                        subtitle: Text(list['description']),
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) =>
                                ListDetailsScreen(list: list),
                          ),
                        ),
                        trailing: isCurrentUser ? IconButton(
                          icon: const Icon(Icons.edit),
                          onPressed: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) =>
                                  CreateEditListScreen(list: list),
                            ),
                          ),
                        ) : null,
                      ),
                    );
                  },
                ),
                const SizedBox(height: 16),
              const Text(
                'Reviews',
                style: TextStyle(
                  fontSize: 18.0,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8.0),
              if (_reviews.isEmpty)
                const Text('No reviews yet.')
              else
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _reviews.length,
                  itemBuilder: (context, index) {
                    final review = _reviews[index];
                    return Card(
                      margin: const EdgeInsets.symmetric(vertical: 4.0),
                      child: Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              review['film']['title'],
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            if (review['rating'] != null)
                              Row(
                                children: List.generate(5, (index) {
                                  return Icon(
                                    index < review['rating']
                                        ? Icons.star
                                        : Icons.star_border,
                                    color: Colors.amber,
                                    size: 16.0,
                                  );
                                }),
                              ),
                            const SizedBox(height: 4.0),
                            Text(review['content']),
                          ],
                        ),
                      ),
                    );
                  },
                ),
            ],
          ),
        ),
      ),
      floatingActionButton: isCurrentUser
          ? FloatingActionButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const CreateEditListScreen(),
                  ),
                ).then((_) => _fetchLists());
              },
              child: const Icon(Icons.add),
            )
          : null,
    );
  }
}
