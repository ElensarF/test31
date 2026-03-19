import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppTheme extends ChangeNotifier {
  bool _isDark = true;
  bool get isDark => _isDark;

  AppTheme() {
    _loadTheme();
  }

  Future<void> _loadTheme() async {
    final prefs = await SharedPreferences.getInstance();
    _isDark = prefs.getBool('isDark') ?? true;
    notifyListeners();
  }

  Future<void> toggleTheme() async {
    _isDark = !_isDark;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isDark', _isDark);
    notifyListeners();
  }

  ThemeData get theme => _isDark ? darkTheme : lightTheme;

  // Colors
  Color get background => _isDark ? const Color(0xFF121212) : const Color(0xFFF5F5F5);
  Color get surface => _isDark ? const Color(0xFF1E1E1E) : Colors.white;
  Color get surfaceHighlight => _isDark ? const Color(0xFF2D2D2D) : const Color(0xFFE8E8E8);
  Color get textPrimary => _isDark ? Colors.white : const Color(0xFF121212);
  Color get textSecondary => _isDark ? const Color(0xFFB0BEC5) : const Color(0xFF546E7A);
  Color get border => _isDark ? const Color(0xFF2D2D2D) : const Color(0xFFE0E0E0);
  Color get brand => const Color(0xFFFF5722);
  Color get success => const Color(0xFF00C853);
  Color get error => const Color(0xFFD50000);

  static final darkTheme = ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: const Color(0xFF121212),
    colorScheme: const ColorScheme.dark(
      primary: Color(0xFFFF5722),
      surface: Color(0xFF1E1E1E),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Color(0xFF1E1E1E),
      elevation: 0,
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: Color(0xFF1E1E1E),
      selectedItemColor: Color(0xFFFF5722),
      unselectedItemColor: Color(0xFFB0BEC5),
    ),
  );

  static final lightTheme = ThemeData(
    brightness: Brightness.light,
    scaffoldBackgroundColor: const Color(0xFFF5F5F5),
    colorScheme: const ColorScheme.light(
      primary: Color(0xFFFF5722),
      surface: Colors.white,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.white,
      elevation: 0,
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: Colors.white,
      selectedItemColor: Color(0xFFFF5722),
      unselectedItemColor: Color(0xFF546E7A),
    ),
  );
}

const Map<String, Color> countryColors = {
  'Turkey': Color(0xFFE30A17),
  'Germany': Color(0xFFFFCC00),
  'Albania': Color(0xFFE41E20),
  'Arabia': Color(0xFF006C35),
  'France': Color(0xFF002395),
  'United Kingdom': Color(0xFF012169),
  'Italy': Color(0xFF008C45),
  'Netherlands': Color(0xFFFF6600),
  'Poland': Color(0xFFDC143C),
  'Portugal': Color(0xFF006600),
  'Romania': Color(0xFF002B7F),
  'Russia': Color(0xFF0039A6),
  'Spain': Color(0xFFAA151B),
  'Bulgaria': Color(0xFF00966E),
  'Balkans': Color(0xFF4A90D9),
};
