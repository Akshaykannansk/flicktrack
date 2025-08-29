import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'create_review_screen.dart';
import 'package:movie_magic_app/config.dart';

class MovieDetailsScreen extends StatefulWidget {
  final dynamic movie;

  const MovieDetailsScreen({super.key, required this.movie});

  @override
  State<MovieDetailsScreen> createState() => _MovieDetailsScreenState();
}

class _MovieDetailsScreenState extends State<MovieDetailsScreen> {
  List<dynamic> _reviews = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchReviews();
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.movie['title']),
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
