
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:movie_magic_app/config.dart';

// Top-level function for JSON encoding in a separate isolate
String _encodeJson(Map<String, dynamic> data) {
  return json.encode(data);
}

class CreateEditListScreen extends StatefulWidget {
  final dynamic list;

  const CreateEditListScreen({super.key, this.list});

  @override
  State<CreateEditListScreen> createState() => _CreateEditListScreenState();
}

class _CreateEditListScreenState extends State<CreateEditListScreen> {
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    if (widget.list != null) {
      _nameController.text = widget.list['name'];
      _descriptionController.text = widget.list['description'];
    }
  }

  Future<void> _submitList() async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) {
      return;
    }
    setState(() {
      _isSubmitting = true;
    });

    final listId = widget.list?['id'];
    final url = widget.list == null
        ? '$baseUrl/lists'
        : "$baseUrl/lists/$listId";
        
    final method = widget.list == null ? 'POST' : 'PUT';

    try {
      final request = http.Request(method, Uri.parse(url));
      request.headers.addAll({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${session.accessToken}',
        });

      final requestBody = {
          'name': _nameController.text,
          'description': _descriptionController.text,
        };

      // Offload JSON encoding to a background isolate
      request.body = await compute(_encodeJson, requestBody);

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        Navigator.of(context).pop();
      } else {
        print('Failed to submit list: ${response.statusCode}');
      }
    } catch (e) {
      print('Error submitting list: $e');
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
        title: Text(widget.list == null ? 'Create List' : 'Edit List'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: 'List Name',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16.0),
            TextField(
              controller: _descriptionController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Description',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16.0),
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submitList,
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
