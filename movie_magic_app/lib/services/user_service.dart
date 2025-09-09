import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:movie_magic_app/config.dart';

class UserService {
  static Future<List<dynamic>> getUserReviews(String userId) async {
    final url = '$baseUrl/users/$userId/reviews';
    final response = await http.get(Uri.parse(url));

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load reviews');
    }
  }

  static Future<List<dynamic>> getUserLists(String userId) async {
    final url = '$baseUrl/users/$userId/lists';
    final response = await http.get(Uri.parse(url));

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load lists');
    }
  }

  static Future<bool> isFollowing(String userId) async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) {
      throw Exception('Not authenticated');
    }

    final url = '$baseUrl/users/$userId/is-following';
    final response = await http.get(
      Uri.parse(url),
      headers: {'Authorization': 'Bearer ${session.accessToken}'},
    );

    if (response.statusCode == 200) {
      return json.decode(response.body)['is_following'];
    } else {
      throw Exception('Failed to check if following');
    }
  }

  static Future<void> toggleFollow(String userId) async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) {
      throw Exception('Not authenticated');
    }

    final url = '$baseUrl/users/$userId/toggle-follow';
    final response = await http.post(
      Uri.parse(url),
      headers: {'Authorization': 'Bearer ${session.accessToken}'},
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to toggle follow');
    }
  }
}
