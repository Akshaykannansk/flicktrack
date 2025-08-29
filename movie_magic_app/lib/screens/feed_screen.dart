import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:movie_magic_app/config.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  final List<dynamic> _reviews = [];
  final _scrollController = ScrollController();
  int _page = 1;
  bool _isLoading = false;
  bool _hasMore = true;

  @override
  void initState() {
    super.initState();
    _fetchFeed();
    _scrollController.addListener(() {
      if (_scrollController.position.pixels ==
          _scrollController.position.maxScrollExtent) {
        _fetchFeed();
      }
    });
  }

  Future<void> _fetchFeed() async {
    if (_isLoading || !_hasMore) {
      return;
    }
    setState(() {
      _isLoading = true;
    });

    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) {
      return;
    }

    final url = '$baseUrl/feed?page=$_page';
    try {
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer ${session.accessToken}',
        },
      );
      if (response.statusCode == 200) {
        final newReviews = json.decode(response.body);
        setState(() {
          if (newReviews.isNotEmpty) {
            _reviews.addAll(newReviews);
            _page++;
          } else {
            _hasMore = false;
          }
        });
      } else {
        print('Failed to load feed: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching feed: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Feed'),
      ),
      body: _isLoading && _reviews.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : _reviews.isEmpty
              ? const Center(child: Text('Your feed is empty.'))
              : ListView.builder(
                  controller: _scrollController,
                  itemCount: _reviews.length + (_hasMore ? 1 : 0),
                  itemBuilder: (context, index) {
                    if (index == _reviews.length) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    final review = _reviews[index];
                    final film = review['film'];
                    return Card(
                      margin: const EdgeInsets.all(8.0),
                      child: Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (film['poster_path'] != null)
                              Image.network(
                                'https://image.tmdb.org/t/p/w200${film['poster_path']}',
                                height: 150,
                              ),
                            const SizedBox(height: 8.0),
                            Text(
                              film['title'],
                              style: const TextStyle(
                                fontSize: 18.0,
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
    );
  }
}
