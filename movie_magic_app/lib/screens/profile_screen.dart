import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'user_list_screen.dart';

class ProfileScreen extends StatefulWidget {
  final dynamic user;

  const ProfileScreen({super.key, required this.user});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  List<dynamic> _reviews = [];
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
    if (_currentUserId != null && _currentUserId != widget.user['id']) {
      await _checkIfFollowing();
    }
    setState(() {
      _isLoading = false;
    });
  }

  Future<void> _fetchReviews() async {
    final url = 'http://localhost:3000/api/users/${widget.user['id']}/reviews';
    try {
      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        if (mounted) {
          setState(() {
            _reviews = json.decode(response.body);
          });
        }
      } else {
        print('Failed to load reviews: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching reviews: $e');
    }
  }

  Future<void> _checkIfFollowing() async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) return;

    final url =
        'http://localhost:3000/api/users/${widget.user['id']}/is-following';
    try {
      final response = await http.get(
        Uri.parse(url),
        headers: {'Authorization': 'Bearer ${session.accessToken}'},
      );
      if (response.statusCode == 200) {
        if (mounted) {
          setState(() {
            _isFollowing = json.decode(response.body)['is_following'];
          });
        }
      } else {
        print('Failed to check if following: ${response.statusCode}');
      }
    } catch (e) {
      print('Error checking if following: $e');
    }
  }

  Future<void> _toggleFollow() async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) return;

    final url =
        'http://localhost:3000/api/users/${widget.user['id']}/toggle-follow';
    try {
      final response = await http.post(
        Uri.parse(url),
        headers: {'Authorization': 'Bearer ${session.accessToken}'},
      );
      if (response.statusCode == 200) {
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
      } else {
        print('Failed to toggle follow: ${response.statusCode}');
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
                          child: Row(
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
    );
  }
}
