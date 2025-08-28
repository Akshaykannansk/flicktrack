import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class TrendingScreen extends StatefulWidget {
  const TrendingScreen({super.key});

  @override
  State<TrendingScreen> createState() => _TrendingScreenState();
}

class _TrendingScreenState extends State<TrendingScreen> {
  List<dynamic> _reviews = [];
  final _scrollController = ScrollController();
  int _page = 1;
  bool _isLoading = false;
  bool _hasMore = true;

  @override
  void initState() {
    super.initState();
    _fetchTrendingReviews();
    _scrollController.addListener(() {
      if (_scrollController.position.pixels ==
          _scrollController.position.maxScrollExtent) {
        _fetchTrendingReviews();
      }
    });
  }

  Future<void> _fetchTrendingReviews() async {
    if (_isLoading || !_hasMore) {
      return;
    }
    setState(() {
      _isLoading = true;
    });
    // This is a placeholder URL. Replace with your actual API endpoint.
    final url = 'http://localhost:3000/api/trending-reviews?page=$_page';
    try {
      final response = await http.get(Uri.parse(url));
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

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return _reviews.isEmpty && _isLoading
        ? const Center(child: CircularProgressIndicator())
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
                      const SizedBox(height: 4.0),
                      Text(review['content']),
                    ],
                  ),
                ),
              );
            },
          );
  }
}
