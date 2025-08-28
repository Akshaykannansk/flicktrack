import 'package:flutter/material.dart';
import 'package:movie_magic_app/services/search_service.dart';
import 'movie_details_screen.dart';
import 'profile_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _searchController = TextEditingController();
  List<dynamic> _movieResults = [];
  List<dynamic> _userResults = [];
  final _scrollController = ScrollController();
  int _moviePage = 1;
  int _userPage = 1;
  bool _isLoading = false;
  bool _hasMoreMovies = true;
  bool _hasMoreUsers = true;
  String _currentQuery = '';

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(() {
      if (_scrollController.position.pixels ==
          _scrollController.position.maxScrollExtent) {
        _search(_currentQuery, loadMore: true);
      }
    });
  }

  Future<void> _search(String query, {bool loadMore = false}) async {
    if (query.isEmpty || (_isLoading && !loadMore)) {
      return;
    }

    if (!loadMore) {
      _moviePage = 1;
      _userPage = 1;
      _movieResults = [];
      _userResults = [];
      _hasMoreMovies = true;
      _hasMoreUsers = true;
      _currentQuery = query;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      if (_hasMoreMovies) {
        final movieResults = await SearchService.searchMovies(query, page: _moviePage);
        setState(() {
          if (movieResults.isNotEmpty) {
            _movieResults.addAll(movieResults);
            _moviePage++;
          } else {
            _hasMoreMovies = false;
          }
        });
      }

      if (_hasMoreUsers) {
        final userResults = await SearchService.searchUsers(query, page: _userPage);
        setState(() {
          if (userResults.isNotEmpty) {
            _userResults.addAll(userResults);
            _userPage++;
          } else {
            _hasMoreUsers = false;
          }
        });
      }
    } catch (e) {
      print('Error searching: $e');
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
        title: TextField(
          controller: _searchController,
          decoration: const InputDecoration(
            hintText: 'Search for movies or users',
            border: InputBorder.none,
          ),
          onSubmitted: (query) => _search(query),
        ),
      ),
      body: _isLoading && _movieResults.isEmpty && _userResults.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : _movieResults.isEmpty && _userResults.isEmpty
              ? const Center(child: Text('No results found.'))
              : ListView.builder(
                  controller: _scrollController,
                  itemCount: _movieResults.length +
                      _userResults.length +
                      (_hasMoreMovies || _hasMoreUsers ? 1 : 0) +
                      2, // For headers
                  itemBuilder: (context, index) {
                    if (index == 0) {
                      return _movieResults.isNotEmpty
                          ? const Padding(
                              padding: EdgeInsets.all(8.0),
                              child: Text(
                                'Movies',
                                style: TextStyle(
                                  fontSize: 18.0,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            )
                          : Container();
                    }
                    index -= 1;

                    if (index < _movieResults.length) {
                      final movie = _movieResults[index];
                      return ListTile(
                        title: Text(movie['title']),
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) =>
                                  MovieDetailsScreen(movie: movie),
                            ),
                          );
                        },
                      );
                    }
                    index -= _movieResults.length;

                    if (index == 0) {
                      return _userResults.isNotEmpty
                          ? const Padding(
                              padding: EdgeInsets.all(8.0),
                              child: Text(
                                'Users',
                                style: TextStyle(
                                  fontSize: 18.0,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            )
                          : Container();
                    }
                    index -= 1;

                    if (index < _userResults.length) {
                      final user = _userResults[index];
                      return ListTile(
                        title: Text(user['username']),
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ProfileScreen(user: user),
                            ),
                          );
                        },
                      );
                    }

                    return const Center(child: CircularProgressIndicator());
                  },
                ),
    );
  }
}
