import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Movie Magic',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: const MovieList(),
    );
  }
}

class MovieList extends StatefulWidget {
  const MovieList({super.key});

  @override
  State<MovieList> createState() => _MovieListState();
}

class _MovieListState extends State<MovieList> {
  List<dynamic> _reviews = [];

  @override
  void initState() {
    super.initState();
    _fetchTrendingReviews();
  }

  Future<void> _fetchTrendingReviews() async {
    // This is a placeholder URL. Replace with your actual API endpoint.
    // You might need to adjust the IP address and port based on where your API is running.
    const url = 'http://localhost:3000/api/trending-reviews';
    try {
       final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        setState(() {
          _reviews = json.decode(response.body);
        });
      } else {
        // Handle non-200 responses
        print('Failed to load reviews: ${response.statusCode}');
      }
    } catch (e) {
      // Handle errors
       print('Error fetching reviews: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Trending Reviews'),
      ),
      body: _reviews.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: _reviews.length,
              itemBuilder: (context, index) {
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
            ),
    );
  }
}
