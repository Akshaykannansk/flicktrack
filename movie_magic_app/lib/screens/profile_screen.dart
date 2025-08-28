import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:supabase_flutter/supabase_flutter.dart';

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

  @override
  void initState() {
    super.initState();
    _fetchReviews();
    _checkIfFollowing();
  }

  Future<void> _fetchReviews() async {
    // This is a placeholder URL. Replace with your actual API endpoint.
    final url = 'http://localhost:3000/api/users/${widget.user['id']}/reviews';
    try {
      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        setState(() {
          _reviews = json.decode(response.body);
        });
      } else {
        print('Failed to load reviews: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching reviews: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _checkIfFollowing() async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) {
      return;
    }
    // This is a placeholder URL. Replace with your actual API endpoint.
    final url = 'http://localhost:3000/api/users/${widget.user['id']}/is-following';
    try {
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer ${session.accessToken}',
        },
      );
      if (response.statusCode == 200) {
        setState(() {
          _isFollowing = json.decode(response.body)['is_following'];
        });
      } else {
        print('Failed to check if following: ${response.statusCode}');
      }
    } catch (e) {
      print('Error checking if following: $e');
    }
  }

  Future<void> _toggleFollow() async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) {
      return;
    }
    // This is a placeholder URL. Replace with your actual API endpoint.
    final url = 'http://localhost:3000/api/users/${widget.user['id']}/toggle-follow';
    try {
      final response = await http.post(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer ${session.accessToken}',
        },
      );
      if (response.statusCode == 200) {
        setState(() {
          _isFollowing = !_isFollowing;
        });
      } else {
        print('Failed to toggle follow: ${response.statusCode}');
      }
    } catch (e) {
      print('Error toggling follow: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.user['username']),
        actions: [
          TextButton(
            onPressed: _toggleFollow,
            child: Text(_isFollowing ? 'Unfollow' : 'Follow'),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
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
                          ..._reviews.map((review) => Card(
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
                              )),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
