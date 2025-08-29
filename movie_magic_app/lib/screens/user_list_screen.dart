import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'profile_screen.dart';

enum UserListType { followers, following }

class UserListScreen extends StatefulWidget {
  final String userId;
  final UserListType listType;

  const UserListScreen(
      {super.key, required this.userId, required this.listType});

  @override
  State<UserListScreen> createState() => _UserListScreenState();
}

class _UserListScreenState extends State<UserListScreen> {
  List<dynamic> _users = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchUsers();
  }

  Future<void> _fetchUsers() async {
    final listTypeString = widget.listType == UserListType.followers
        ? 'followers'
        : 'following';
    // This is a placeholder URL. Replace with your actual API endpoint.
    final url =
        'http://localhost:3000/api/users/${widget.userId}/$listTypeString';
    try {
      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        setState(() {
          _users = json.decode(response.body);
        });
      } else {
        print('Failed to load users: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching users: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.listType == UserListType.followers
            ? 'Followers'
            : 'Following'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: _users.length,
              itemBuilder: (context, index) {
                final user = _users[index];
                return ListTile(
                  leading: CircleAvatar(
                    backgroundImage: user['imageUrl'] != null
                        ? NetworkImage(user['imageUrl'])
                        : null,
                    child: user['imageUrl'] == null
                        ? const Icon(Icons.person)
                        : null,
                  ),
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
              },
            ),
    );
  }
}
