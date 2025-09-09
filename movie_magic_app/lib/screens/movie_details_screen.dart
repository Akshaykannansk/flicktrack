import 'package:flutter/material.dart';
import 'package:movie_magic_app/services/review_service.dart';
import 'package:movie_magic_app/services/movie_service.dart';
import 'create_review_screen.dart';

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
    try {
      final reviews = await ReviewService.getReviews(widget.movie['id'].toString());
      setState(() {
        _reviews = reviews;
      });
    } catch (e) {
      print('Error fetching reviews: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _checkIfWatchlistedAndFavorited() async {
    try {
      final status = await MovieService.getMovieStatus(widget.movie['id'].toString());
      setState(() {
        _isWatchlisted = status['isWatchlisted'];
        _isFavorited = status['isFavorited'];
      });
    } catch (e) {
      print('Error checking movie status: $e');
    }
  }

  Future<void> _toggleWatchlist() async {
    try {
      await MovieService.toggleWatchlist(widget.movie['id'].toString());
      setState(() {
        _isWatchlisted = !_isWatchlisted;
      });
    } catch (e) {
      print('Error toggling watchlist: $e');
    }
  }

  Future<void> _toggleFavorite() async {
    try {
      await MovieService.toggleFavorite(widget.movie['id'].toString());
      setState(() {
        _isFavorited = !_isFavorited;
      });
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
          ).then((_) => _fetchReviews());
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
