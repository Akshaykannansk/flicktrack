import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:movie_magic_app/config.dart';

class MovieService {
  static Future<Map<String, dynamic>> getMovieStatus(String movieId) async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) {
      throw Exception('Not authenticated');
    }

    final url = '$baseUrl/movies/$movieId/status';
    final response = await http.get(
      Uri.parse(url),
      headers: {'Authorization': 'Bearer ${session.accessToken}'},
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to get movie status');
    }
  }

  static Future<void> toggleWatchlist(String movieId) async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) {
      throw Exception('Not authenticated');
    }

    final url = '$baseUrl/movies/$movieId/toggle-watchlist';
    final response = await http.post(
      Uri.parse(url),
      headers: {'Authorization': 'Bearer ${session.accessToken}'},
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to toggle watchlist');
    }
  }

  static Future<void> toggleFavorite(String movieId) async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) {
      throw Exception('Not authenticated');
    }

    final url = '$baseUrl/movies/$movieId/toggle-favorite';
    final response = await http.post(
      Uri.parse(url),
      headers: {'Authorization': 'Bearer ${session.accessToken}'},
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to toggle favorite');
    }
  }
}
