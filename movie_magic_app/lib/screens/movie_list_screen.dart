import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:movie_magic_app/config.dart';
import 'package:movie_magic_app/screens/movie_details_screen.dart';

enum MovieListType { watchlist, favorite }

class MovieListScreen extends StatefulWidget {
  final String userId;
  final MovieListType listType;

  const MovieListScreen(
      {super.key, required this.userId, required this.listType});

  @override
  State<MovieListScreen> createState() => _MovieListScreenState();
}

class _MovieListScreenState extends State<MovieListScreen> {
  List<dynamic> _movies = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchMovies();
  }

  Future<void> _fetchMovies() async {
    final listTypeString =
        widget.listType == MovieListType.watchlist ? 'watchlist' : 'favorites';
    final url = '$baseUrl/users/${widget.userId}/$listTypeString';
    try {
      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        setState(() {
          _movies = json.decode(response.body);
        });
      } else {
        print('Failed to load movies: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching movies: $e');
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
        title: Text(widget.listType == MovieListType.watchlist
            ? 'Watchlist'
            : 'Favorite Movies'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: _movies.length,
              itemBuilder: (context, index) {
                final movie = _movies[index];
                return ListTile(
                  leading: movie['poster_path'] != null
                      ? Image.network(
                          'https://image.tmdb.org/t/p/w92${movie['poster_path']}',
                        )
                      : const Icon(Icons.movie),
                  title: Text(movie['title']),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => MovieDetailsScreen(movie: movie),
                      ),
                    );
                  },
                );
              },
            ),
    );
  }
}
