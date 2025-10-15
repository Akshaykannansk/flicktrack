import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:movie_magic_app/config.dart';

class UserService {
  static Future<Map<String, dynamic>> getUserProfile(String userId) async {
    final url = '$baseUrl/users/$userId';
    final response = await http.get(Uri.parse(url));

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load user profile');
    }
  }

  static Future<void> updateUserProfile(String userId, String username, String bio) async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) {
      throw Exception('Not authenticated');
    }

    final url = '$baseUrl/profile';
    final response = await http.put(
      Uri.parse(url),
      headers: {
        'Authorization': 'Bearer ${session.accessToken}',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'username': username,
        'bio': bio,
      }),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to update profile');
    }
  }

  static Future<String> uploadAvatar(String userId, List<int> imageBytes, String fileExt) async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) {
      throw Exception('Not authenticated');
    }

    final url = '$baseUrl/profile/avatar';
    final request = http.MultipartRequest('POST', Uri.parse(url));
    request.headers['Authorization'] = 'Bearer ${session.accessToken}';
    request.files.add(http.MultipartFile.fromBytes(
      'avatar',
      imageBytes,
      filename: '$userId.$fileExt',
    ));

    final response = await request.send();

    if (response.statusCode == 200) {
      final responseBody = await response.stream.bytesToString();
      return json.decode(responseBody)['avatar_url'];
    } else {
      throw Exception('Failed to upload avatar');
    }
  }

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
