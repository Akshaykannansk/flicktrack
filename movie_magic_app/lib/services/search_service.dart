import 'package:http/http.dart' as http;
import 'dart:convert';

class SearchService {
  // This is a placeholder URL. Replace with your actual API endpoint.
  static const String _baseUrl = 'http://localhost:3000/api/search';

  static Future<List<dynamic>> searchMovies(String query, {int page = 1}) async {
    final response = await http.get(Uri.parse('$_baseUrl/movies?q=$query&page=$page'));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to search movies');
    }
  }

  static Future<List<dynamic>> searchUsers(String query, {int page = 1}) async {
    final response = await http.get(Uri.parse('$_baseUrl/users?q=$query&page=$page'));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to search users');
    }
  }
}
