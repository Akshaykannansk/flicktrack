import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:movie_magic_app/config.dart';
import 'movie_details_screen.dart';

class ListDetailsScreen extends StatefulWidget {
  final dynamic list;

  const ListDetailsScreen({super.key, required this.list});

  @override
  State<ListDetailsScreen> createState() => _ListDetailsScreenState();
}

class _ListDetailsScreenState extends State<ListDetailsScreen> {
  List<dynamic> _movies = [];
  bool _isLoading = true;
  dynamic _listDetails;
  final _currentUserId = Supabase.instance.client.auth.currentUser?.id;

  @override
  void initState() {
    super.initState();
    _fetchListDetails();
  }

  Future<void> _fetchListDetails() async {
    final url = '$baseUrl/lists/${widget.list['id']}';
    try {
      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        if (mounted) {
          final decodedBody = json.decode(response.body);
          setState(() {
            _listDetails = decodedBody;
            _movies = decodedBody['movies'];
            _isLoading = false;
          });
        }
      } else {
        print('Failed to load list details: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching list details: $e');
    }
  }

  Future<void> _copyList() async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) {
      return;
    }

    final url = '$baseUrl/lists/${widget.list['id']}/copy';
    try {
      final response = await http.post(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer ${session.accessToken}',
        },
      );
      if (response.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('List copied successfully!')),
        );
      } else {
        print('Failed to copy list: ${response.statusCode}');
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to copy list.')),
        );
      }
    } catch (e) {
      print('Error copying list: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('An error occurred while copying the list.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isOwner = _listDetails != null && _currentUserId == _listDetails['user_id'];

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.list['name']),
        actions: [
          if (!isOwner && !_isLoading)
            IconButton(
              icon: const Icon(Icons.copy),
              onPressed: _copyList,
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: _movies.length,
              itemBuilder: (context, index) {
                final movie = _movies[index];
                return ListTile(
                  title: Text(movie['title']),
                  leading: movie['poster_path'] != null
                      ? Image.network(
                          'https://image.tmdb.org/t/p/w200${movie['poster_path']}',
                          fit: BoxFit.cover,
                          width: 50,
                        )
                      : null,
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => MovieDetailsScreen(movie: movie),
                    ),
                  ),
                );
              },
            ),
    );
  }
}
