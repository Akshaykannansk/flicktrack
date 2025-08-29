import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:movie_magic_app/config.dart';

class CreateReviewScreen extends StatefulWidget {
  final dynamic movie;

  const CreateReviewScreen({super.key, required this.movie});

  @override
  State<CreateReviewScreen> createState() => _CreateReviewScreenState();
}

class _CreateReviewScreenState extends State<CreateReviewScreen> {
  final _reviewController = TextEditingController();
  bool _isSubmitting = false;

  Future<void> _submitReview() async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) {
      return;
    }
    setState(() {
      _isSubmitting = true;
    });
    final url = '$baseUrl/movies/${widget.movie['id']}/reviews';
    try {
      final response = await http.post(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${session.accessToken}',
        },
        body: json.encode({
          'content': _reviewController.text,
        }),
      );
      if (response.statusCode == 201) {
        Navigator.of(context).pop();
      } else {
        print('Failed to submit review: ${response.statusCode}');
      }
    } catch (e) {
      print('Error submitting review: $e');
    } finally {
      setState(() {
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Create Review for ${widget.movie['title']}'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Column(
          children: [
            TextField(
              controller: _reviewController,
              maxLines: 5,
              decoration: const InputDecoration(
                hintText: 'Write your review here',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 8.0),
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submitReview,
              child: _isSubmitting
                  ? const CircularProgressIndicator()
                  : const Text('Submit'),
            ),
          ],
        ),
      ),
    );
  }
}
