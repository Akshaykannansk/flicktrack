import 'package:flutter/material.dart';
import 'package:movie_magic_app/services/user_service.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'user_list_screen.dart';
import 'movie_list_screen.dart';
import 'create_edit_list_screen.dart';
import 'list_details_screen.dart';

class ProfileScreen extends StatefulWidget {
  final dynamic user;

  const ProfileScreen({super.key, required this.user});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  List<dynamic> _reviews = [];
  List<dynamic> _lists = [];
  bool _isLoading = true;
  bool _isFollowing = false;
  late int _followersCount;
  final _currentUserId = Supabase.instance.client.auth.currentUser?.id;

  @override
  void initState() {
    super.initState();
    _followersCount = widget.user['followers_count'] ?? 0;
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() {
      _isLoading = true;
    });
    await _fetchReviews();
    await _fetchLists();
    if (_currentUserId != null && _currentUserId != widget.user['id']) {
      await _checkIfFollowing();
    }
    setState(() {
      _isLoading = false;
    });
  }

  Future<void> _fetchReviews() async {
    try {
      final reviews = await UserService.getUserReviews(widget.user['id']);
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
      final lists = await UserService.getUserLists(widget.user['id']);
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
      final isFollowing = await UserService.isFollowing(widget.user['id']);
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
      await UserService.toggleFollow(widget.user['id']);
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

  @override
  Widget build(BuildContext context) {
    final bool isCurrentUser = _currentUserId == widget.user['id'];

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.user['username']),
        actions: [
          if (!isCurrentUser)
            TextButton(
              onPressed: _toggleFollow,
              child: Text(_isFollowing ? 'Unfollow' : 'Follow'),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 40,
                          backgroundImage: widget.user['image_url'] != null
                              ? NetworkImage(widget.user['image_url'])
                              : null,
                          child: widget.user['image_url'] == null
                              ? const Icon(Icons.person, size: 40)
                              : null,
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
                                          userId: widget.user['id'] as String,
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
                                          userId: widget.user['id'] as String,
                                          listType: UserListType.following,
                                        ),
                                      ),
                                    ),
                                    child: Column(
                                      children: [
                                        Text(
                                          (widget.user['following_count'] ?? 0)
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
                                          userId: widget.user['id'] as String,
                                          listType: MovieListType.watchlist,
                                        ),
                                      ),
                                    ),
                                    child: Column(
                                      children: [
                                        Text(
                                          (widget.user['watchlist_count'] ?? 0)
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
                                          userId: widget.user['id'] as String,
                                          listType: MovieListType.favorite,
                                        ),
                                      ),
                                    ),
                                    child: Column(
                                      children: [
                                        Text(
                                          (widget.user['favorites_count'] ?? 0)
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
                    if (widget.user['bio'] != null &&
                        widget.user['bio'].isNotEmpty) ...[
                      const Text(
                        'Bio',
                        style: TextStyle(
                          fontSize: 18.0,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8.0),
                      Text(widget.user['bio']),
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
