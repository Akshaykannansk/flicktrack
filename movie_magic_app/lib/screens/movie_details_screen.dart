import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'create_review_screen.dart';
import 'package:movie_magic_app/config.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class MovieDetailsScreen extends StatefulWidget {
  final dynamic movie;

  const MovieDetailsScreen({super.key, required this.movie});

  @override
  State<MovieDetailsScreen> createState() => _MovieDetailsScreenState();
}

class _MovieDetailsScreenState extends State<MovieDetailsScreen> {
  List<dynamic> _reviews = [];
  bool _isLoading = true;
  bool _isWatchlisted = false;
  bool _isFavorited = false;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    _fetchReviews();
    _checkIfWatchlistedAndFavorited();
  }

  Future<void> _fetchReviews() async {
    final url = '$baseUrl/movies/${widget.movie['id']}/reviews';
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

  Future<void> _checkIfWatchlistedAndFavorited() async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) return;

    final url = '$baseUrl/movies/${widget.movie['id']}/status';
    try {
      final response = await http.get(
        Uri.parse(url),
        headers: {'Authorization': 'Bearer ${session.accessToken}'},
      );
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          _isWatchlisted = data['isWatchlisted'];
          _isFavorited = data['isFavorited'];
        });
      } else {
        print(
            'Failed to check if movie is watchlisted or favorited: ${response.statusCode}');
      }
    } catch (e) {
      print('Error checking if movie is watchlisted or favorited: $e');
    }
  }

  Future<void> _toggleWatchlist() async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) return;

    final url = '$baseUrl/movies/${widget.movie['id']}/toggle-watchlist';
    try {
      final response = await http.post(
        Uri.parse(url),
        headers: {'Authorization': 'Bearer ${session.accessToken}'},
      );
      if (response.statusCode == 200) {
        setState(() {
          _isWatchlisted = !_isWatchlisted;
        });
      } else {
        print('Failed to toggle watchlist: ${response.statusCode}');
      }
    } catch (e) {
      print('Error toggling watchlist: $e');
    }
  }

  Future<void> _toggleFavorite() async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) return;

    final url = '$baseUrl/movies/${widget.movie['id']}/toggle-favorite';
    try {
      final response = await http.post(
        Uri.parse(url),
        headers: {'Authorization': 'Bearer ${session.accessToken}'},
      );
      if (response.statusCode == 200) {
        setState(() {
          _isFavorited = !_isFavorited;
        });
      } else {
        print('Failed to toggle favorite: ${response.statusCode}');
      }
    } catch (e) {
      print('Error toggling favorite: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.movie['title']),
        actions: [
          IconButton(
            onPressed: _toggleWatchlist,
            icon: Icon(
              _isWatchlisted ? Icons.bookmark : Icons.bookmark_border,
            ),
          ),
          IconButton(
            onPressed: _toggleFavorite,
            icon: Icon(
              _isFavorited ? Icons.favorite : Icons.favorite_border,
            ),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (widget.movie['poster_path'] != null)
                    Image.network(
                      'https://image.tmdb.org/t/p/w500${widget.movie['poster_path']}',
                      fit: BoxFit.cover,
                    ),
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
                                        review['user']['username'],
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
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => CreateReviewScreen(movie: widget.movie),
            ),
          );
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
