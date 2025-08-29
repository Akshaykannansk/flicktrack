# Creating a Flutter App for Your Web Application

This guide outlines the process of creating a Flutter app for your existing web application.

## Why Flutter?

Flutter is a great choice for building cross-platform applications from a single codebase. It offers:

*   **Fast Development:** Hot reload allows you to see changes in your app instantly.
*   **Expressive UI:** A rich set of customizable widgets to build beautiful native interfaces.
*   **Native Performance:** Your app will be compiled to native ARM code, ensuring high performance.

## General Steps to Create a Flutter App

### 1. Set Up Your Flutter Environment

*   Install the Flutter SDK: [https://flutter.dev/docs/get-started/install](https://flutter.dev/docs/get-started/install)
*   Set up your editor of choice (VS Code or Android Studio).
*   Install the Flutter and Dart plugins for your editor.

### 2. Create a New Flutter Project

```bash
flutter create my_app
cd my_app
```

### 3. Project Structure

*   `lib/main.dart`: The entry point of your application.
*   `pubspec.yaml`: Your project's configuration file, where you'll declare dependencies.
*   `lib/`: The folder where you'll write your Dart code.

### 4. Reusing Business Logic

You have two main options for reusing your existing business logic:

*   **Shared Library/Package:** If your business logic is written in a language that can be compiled to a native library (like Rust or C++), you can create a shared library and call it from your Flutter app using `dart:ffi`.
*   **API Calls:** This is the most common approach. Your Flutter app will make HTTP requests to your existing backend, just like your web app does.

### 5. Building the User Interface

Flutter uses a declarative UI framework. You'll build your UI using widgets. Some common widgets include:

*   `MaterialApp`: The root of your application.
*   `Scaffold`: Provides a basic app layout with an app bar, body, and more.
*   `Column` and `Row`: For arranging widgets vertically and horizontally.
*   `Text`: To display text.
*   `Image`: To display images.
*   `ListView`: To display a scrollable list of items.

### 6. State Management

For managing the state of your application, you can use one of the many available solutions:

*   **Provider:** A simple and easy-to-use state management solution.
*   **Riverpod:** A more advanced and flexible state management library.
*   **BLoC (Business Logic Component):** A pattern for separating business logic from the UI.

## Specifics for Your Application

### 1. Key Features

Your Flutter app should include the following features:

*   User authentication (login, signup).
*   Movie browsing and searching.
*   Viewing movie details.
*   Managing user profiles.
*   Following/unfollowing users.
*   Creating reviews for movies with a star rating.
*   Viewing a feed of recent reviews from followed users.
*   Viewing a user's watchlist and favorite movies.
*   Adding/removing movies from the watchlist and favorites.
*   Creating, updating, and copying movie lists.

### 2. Connecting to Your Backend

Your Flutter app will act as a client to your existing backend. You can use the `http` package to make HTTP requests to your API endpoints.

```dart
import 'package:http/http.dart' as http;

Future<void> fetchMovies() async {
  final response = await http.get(Uri.parse('YOUR_API_ENDPOINT/movies'));
  // ... handle the response
}
```

### 3. Code Examples

Here's a simple example of how you might fetch and display a list of movies:

```dart
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class MovieList extends StatefulWidget {
  @override
  _MovieListState createState() => _MovieListState();
}

class _MovieListState extends State<MovieList> {
  List<dynamic> _movies = [];

  @override
  void initState() {
    super.initState();
    _fetchMovies();
  }

  Future<void> _fetchMovies() async {
    final response = await http.get(Uri.parse('YOUR_API_ENDPOINT/movies'));
    if (response.statusCode == 200) {
      setState(() {
        _movies = json.decode(response.body);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Movies')),
      body: ListView.builder(
        itemCount: _movies.length,
        itemBuilder: (context, index) {
          return ListTile(
            title: Text(_movies[index]['title']),
            // ... more movie details
          );
        },
      ),
    );
  }
}
```

### 4. Feature Implementation

The application has been extended to include watchlist, favorites, and movie rating functionality. Here's a breakdown of the implementation:

*   **Movie Reviews and Ratings**: The application now includes a comprehensive movie review and rating system.
    *   **`create_review_screen.dart`**: The review creation screen has been enhanced to include a 1-to-5 star rating system. Users can now provide a star rating in addition to their written review. The UI uses a row of `IconButton` widgets that change from `Icons.star_border` to `Icons.star` to represent the selected rating.
    *   **Displaying Ratings**: The star ratings are now displayed alongside the reviews in multiple locations within the app:
        *   **`movie_details_screen.dart`**: Each review card on the movie details page now shows the star rating given by the user.
        *   **`profile_screen.dart`**: The list of reviews on a user's profile page now includes the star rating for each review.
        *   **`feed_screen.dart`**: Reviews appearing in the user's feed also display the associated star rating.

*   **`movie_list_screen.dart`**: A new screen has been created to display a list of movies. This screen is used to show a user's watchlist and their list of favorite movies. It takes a `userId` and a `MovieListType` (either `watchlist` or `favorite`) as input and fetches the corresponding list of movies from the backend.

*   **`profile_screen.dart`**: The user profile screen has been updated to include two new sections: "Watchlist" and "Favorites". These sections display the number of movies in each list and, when tapped, navigate to the `MovieListScreen` to show the full list.

*   **`movie_details_screen.dart`**: The movie details screen now includes two icon buttons in the app bar: one for the watchlist and one for favorites. These buttons allow the user to add or remove the currently viewed movie from their watchlist or favorites. The screen also fetches the current watchlist and favorite status for the movie when it loads, so the button icons can reflect the current state.

*   **Movie List Management**: Users can now create, update, and copy movie lists.
    *   **`create_edit_list_screen.dart`**: A new screen allows users to create new movie lists or edit existing ones by providing a name and description.
    *   **`list_details_screen.dart`**: This screen displays the movies within a selected list. If the user is viewing another user's list, they will see a "copy" button to duplicate the list for themselves.
    *   **`profile_screen.dart`**: The profile screen now displays a list of the user's movie lists. Tapping on a list navigates to the `list_details_screen.dart`. A floating action button is available for creating new lists.

These changes are supported by API calls to the backend to fetch and update the user's watchlist and favorite movies. The `http` package is used for these network requests, and Supabase is used for user authentication and session management.

### 5. Challenges

*   **Different Screen Sizes:** Use Flutter's responsive design features to adapt your UI to different screen sizes.
*   **Device Capabilities:** Be mindful of device-specific features and limitations.
*   **Performance:** Optimize your app for performance by using techniques like lazy loading and code splitting.

### 6. Further Reading

*   **Flutter Documentation:** [https://flutter.dev/docs](https://flutter.dev/docs)
*   **Provider Package:** [https://pub.dev/packages/provider](https://pub.dev/packages/provider)
*   **HTTP Package:** [https://pub.dev/packages/http](https://pub.dev/packages/http)
