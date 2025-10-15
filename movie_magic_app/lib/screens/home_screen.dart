import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'trending_screen.dart';
import 'feed_screen.dart';
import 'search_screen.dart';
import 'profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  Future<dynamic> _getUserProfile() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) {
      throw Exception('Not authenticated');
    }
    final response = await Supabase.instance.client
        .from('profiles')
        .select()
        .eq('id', userId)
        .single();
    return response;
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      const TrendingScreen(),
      const FeedScreen(),
      FutureBuilder<dynamic>(
        future: _getUserProfile(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError || !snapshot.hasData || snapshot.data == null) {
            return Center(
              child: Text(snapshot.hasError
                  ? 'Error: ${snapshot.error}'
                  : 'Profile not found. Please try logging out and back in.'),
            );
          }
          return ProfileScreen(user: snapshot.data);
        },
      ),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(_selectedIndex == 0
            ? 'Trending'
            : _selectedIndex == 1
                ? 'My Feed'
                : 'Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const SearchScreen()),
              );
            },
          ),
        ],
      ),
      body: IndexedStack(
        index: _selectedIndex,
        children: screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.trending_up),
            label: 'Trending',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.feed),
            label: 'My Feed',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
      ),
    );
  }
}
