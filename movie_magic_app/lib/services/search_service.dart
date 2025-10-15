import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:movie_magic_app/config.dart';

class SearchService {

  static Future<List<dynamic>> searchMovies(String query, {int page = 1}) async {
    final response = await http.get(Uri.parse('$baseUrl/search/movies?q=$query&page=$page'));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to search movies');
    }
  }

  static Future<List<dynamic>> searchUsers(String query, {int page = 1}) async {
    final response = await http.get(Uri.parse('$baseUrl/search/users?q=$query&page=$page'));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to search users');
    }
  }
}
