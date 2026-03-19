import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'theme/app_theme.dart';
import 'screens/home_screen.dart';
import 'screens/categories_screen.dart';
import 'screens/search_screen.dart';
import 'screens/favorites_screen.dart';
import 'screens/settings_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    ChangeNotifierProvider(
      create: (_) => AppTheme(),
      child: const ElensarTVApp(),
    ),
  );
}

class _NoLocaleDelegate extends LocalizationsDelegate<MaterialLocalizations> {
  const _NoLocaleDelegate();
  @override
  bool isSupported(Locale locale) => true;
  @override
  Future<MaterialLocalizations> load(Locale locale) =>
      DefaultMaterialLocalizations.load(const Locale('en', 'US'));
  @override
  bool shouldReload(covariant LocalizationsDelegate old) => false;
}

class ElensarTVApp extends StatelessWidget {
  const ElensarTVApp({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = context.watch<AppTheme>();
    return MaterialApp(
      title: 'ElensarTV',
      debugShowCheckedModeBanner: false,
      theme: theme.theme,
      locale: const Locale('en', 'US'),
      supportedLocales: const [Locale('en', 'US')],
      localizationsDelegates: const [_NoLocaleDelegate()],
      home: const MainShell(),
    );
  }
}

class MainShell extends StatefulWidget {
  const MainShell({super.key});
  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  final _screens = const [
    HomeScreen(),
    CategoriesScreen(),
    SearchScreen(),
    FavoritesScreen(),
    SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final t = context.watch<AppTheme>();
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        type: BottomNavigationBarType.fixed,
        backgroundColor: t.surface,
        selectedItemColor: t.brand,
        unselectedItemColor: t.textSecondary,
        selectedFontSize: 11,
        unselectedFontSize: 11,
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_filled), label: 'Ana Sayfa'),
          BottomNavigationBarItem(icon: Icon(Icons.grid_view_rounded), label: 'Kategoriler'),
          BottomNavigationBarItem(icon: Icon(Icons.search), label: 'Ara'),
          BottomNavigationBarItem(icon: Icon(Icons.favorite), label: 'Favoriler'),
          BottomNavigationBarItem(icon: Icon(Icons.settings_outlined), label: 'Ayarlar'),
        ],
      ),
    );
  }
}
