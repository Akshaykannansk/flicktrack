import 'package:flutter/material.dart';

class SearchState extends ChangeNotifier {
  List<dynamic> _movieResults = [];
  List<dynamic> _userResults = [];
  bool _isLoading = false;
  bool _hasMoreMovies = true;
  bool _hasMoreUsers = true;

  List<dynamic> get movieResults => _movieResults;
  List<dynamic> get userResults => _userResults;
  bool get isLoading => _isLoading;
  bool get hasMoreMovies => _hasMoreMovies;
  bool get hasMoreUsers => _hasMoreUsers;

  void setMovieResults(List<dynamic> results) {
    _movieResults = results;
    notifyListeners();
  }

  void setUserResults(List<dynamic> results) {
    _userResults = results;
    notifyListeners();
  }

  void setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void setHasMoreMovies(bool hasMore) {
    _hasMoreMovies = hasMore;
    notifyListeners();
  }

  void setHasMoreUsers(bool hasMore) {
    _hasMoreUsers = hasMore;
    notifyListeners();
  }

  void addMovieResults(List<dynamic> results) {
    _movieResults.addAll(results);
    notifyListeners();
  }

  void addUserResults(List<dynamic> results) {
    _userResults.addAll(results);
    notifyListeners();
  }

  void reset() {
    _movieResults = [];
    _userResults = [];
    _isLoading = false;
    _hasMoreMovies = true;
    _hasMoreUsers = true;
    notifyListeners();
  }
}
