import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:movie_magic_app/config.dart';

class ReviewService {
  static Future<http.Response> submitReview(String movieId, String content, double rating) async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) {
      throw Exception('Not authenticated');
    }

    final url = '$baseUrl/movies/$movieId/reviews';
    final response = await http.post(
      Uri.parse(url),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${session.accessToken}',
      },
      body: json.encode({
        'content': content,
        'rating': rating,
      }),
    );

    return response;
  }

  static Future<List<dynamic>> getReviews(String movieId) async {
    final url = '$baseUrl/movies/$movieId/reviews';
    final response = await http.get(Uri.parse(url));

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load reviews');
    }
  }
}
