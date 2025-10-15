import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:movie_magic_app/services/search_service.dart';
import 'package:movie_magic_app/screens/search_state.dart';
import 'movie_details_screen.dart';
import 'profile_screen.dart';

class SearchScreen extends StatelessWidget {
  const SearchScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => SearchState(),
      child: const _SearchScreen(),
    );
  }
}

class _SearchScreen extends StatefulWidget {
  const _SearchScreen();

  @override
  State<_SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<_SearchScreen> {
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();
  int _moviePage = 1;
  int _userPage = 1;
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
    final searchState = Provider.of<SearchState>(context, listen: false);

    if (query.isEmpty || (searchState.isLoading && !loadMore)) {
      return;
    }

    if (!loadMore) {
      _moviePage = 1;
      _userPage = 1;
      _currentQuery = query;
      searchState.reset();
    }

    searchState.setLoading(true);

    try {
      if (searchState.hasMoreMovies) {
        final movieResults = await SearchService.searchMovies(query, page: _moviePage);
        if (movieResults.isNotEmpty) {
          searchState.addMovieResults(movieResults);
          _moviePage++;
        } else {
          searchState.setHasMoreMovies(false);
        }
      }

      if (searchState.hasMoreUsers) {
        final userResults = await SearchService.searchUsers(query, page: _userPage);
        if (userResults.isNotEmpty) {
          searchState.addUserResults(userResults);
          _userPage++;
        } else {
          searchState.setHasMoreUsers(false);
        }
      }
    } catch (e) {
      print('Error searching: $e');
    } finally {
      searchState.setLoading(false);
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
      body: Consumer<SearchState>(
        builder: (context, searchState, child) {
          if (searchState.isLoading && searchState.movieResults.isEmpty && searchState.userResults.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          } else if (searchState.movieResults.isEmpty && searchState.userResults.isEmpty) {
            return const Center(child: Text('No results found.'));
          } else {
            return ListView.builder(
              controller: _scrollController,
              itemCount: searchState.movieResults.length +
                  searchState.userResults.length +
                  (searchState.hasMoreMovies || searchState.hasMoreUsers ? 1 : 0) +
                  2, // For headers
              itemBuilder: (context, index) {
                if (index == 0) {
                  return searchState.movieResults.isNotEmpty
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

                if (index < searchState.movieResults.length) {
                  final movie = searchState.movieResults[index];
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
                index -= searchState.movieResults.length;

                if (index == 0) {
                  return searchState.userResults.isNotEmpty
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

                if (index < searchState.userResults.length) {
                  final user = searchState.userResults[index];
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
            );
          }
        },
      ),
    );
  }
}
