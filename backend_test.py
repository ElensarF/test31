#!/usr/bin/env python3
"""
Comprehensive backend API testing for ElensarTV IPTV Player
Tests all API endpoints mentioned in the review request
"""

import asyncio
import httpx
import json
from datetime import datetime

# Backend URL from frontend/.env
BACKEND_BASE_URL = "https://iptv-player-preview-1.preview.emergentagent.com/api"

class TestResults:
    def __init__(self):
        self.results = []
        self.failed_tests = []
        
    def add_result(self, test_name, success, details):
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)
        if not success:
            self.failed_tests.append(result)
    
    def print_summary(self):
        print("\n" + "="*80)
        print("BACKEND API TEST SUMMARY")
        print("="*80)
        
        total_tests = len(self.results)
        passed_tests = len([r for r in self.results if r['success']])
        failed_tests = len(self.failed_tests)
        
        print(f"Total tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if self.failed_tests:
            print("\nFAILED TESTS:")
            for test in self.failed_tests:
                print(f"❌ {test['test']}: {test['details']}")
        
        print("\nDETAILED RESULTS:")
        for result in self.results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test']}: {result['details']}")

async def test_channels_api():
    """Test channel listing and categories endpoints"""
    results = TestResults()
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Test 1: Get channels (basic)
        try:
            response = await client.get(f"{BACKEND_BASE_URL}/channels")
            if response.status_code == 200:
                data = response.json()
                if 'channels' in data and 'total' in data:
                    results.add_result(
                        "GET /channels (basic)", 
                        True, 
                        f"Returned {len(data['channels'])} channels, total: {data['total']}"
                    )
                else:
                    results.add_result("GET /channels (basic)", False, "Missing required fields in response")
            else:
                results.add_result("GET /channels (basic)", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            results.add_result("GET /channels (basic)", False, f"Exception: {str(e)}")

        # Test 2: Get channels with pagination
        try:
            response = await client.get(f"{BACKEND_BASE_URL}/channels?skip=0&limit=10")
            if response.status_code == 200:
                data = response.json()
                if len(data.get('channels', [])) <= 10:
                    results.add_result("GET /channels (pagination)", True, f"Pagination working, got {len(data['channels'])} channels")
                else:
                    results.add_result("GET /channels (pagination)", False, "Pagination limit not respected")
            else:
                results.add_result("GET /channels (pagination)", False, f"HTTP {response.status_code}")
        except Exception as e:
            results.add_result("GET /channels (pagination)", False, f"Exception: {str(e)}")

        # Test 3: Get channels with search
        try:
            response = await client.get(f"{BACKEND_BASE_URL}/channels?search=TRT")
            if response.status_code == 200:
                data = response.json()
                results.add_result("GET /channels (search)", True, f"Search returned {len(data.get('channels', []))} channels")
            else:
                results.add_result("GET /channels (search)", False, f"HTTP {response.status_code}")
        except Exception as e:
            results.add_result("GET /channels (search)", False, f"Exception: {str(e)}")

        # Test 4: Get channels with group filter
        try:
            response = await client.get(f"{BACKEND_BASE_URL}/channels?group=Turkey")
            if response.status_code == 200:
                data = response.json()
                results.add_result("GET /channels (group filter)", True, f"Group filter returned {len(data.get('channels', []))} channels")
            else:
                results.add_result("GET /channels (group filter)", False, f"HTTP {response.status_code}")
        except Exception as e:
            results.add_result("GET /channels (group filter)", False, f"Exception: {str(e)}")

        # Test 5: Get categories (should return 15 countries)
        try:
            response = await client.get(f"{BACKEND_BASE_URL}/channels/categories")
            if response.status_code == 200:
                categories = response.json()
                if isinstance(categories, list) and len(categories) >= 10:
                    results.add_result("GET /channels/categories", True, f"Returned {len(categories)} categories")
                    # Check if categories have expected structure
                    if categories and 'name' in categories[0] and 'count' in categories[0]:
                        results.add_result("Categories structure", True, "Categories have correct structure (name, count)")
                    else:
                        results.add_result("Categories structure", False, "Categories missing name or count fields")
                else:
                    results.add_result("GET /channels/categories", False, f"Expected at least 10 categories, got {len(categories) if isinstance(categories, list) else 'invalid response'}")
            else:
                results.add_result("GET /channels/categories", False, f"HTTP {response.status_code}")
        except Exception as e:
            results.add_result("GET /channels/categories", False, f"Exception: {str(e)}")

        # Test 6: Check for no _id fields in responses  
        try:
            response = await client.get(f"{BACKEND_BASE_URL}/channels?limit=1")
            if response.status_code == 200:
                data = response.json()
                channels = data.get('channels', [])
                if channels:
                    has_id_field = any('_id' in channel for channel in channels)
                    if not has_id_field:
                        results.add_result("No _id fields leak", True, "MongoDB _id fields correctly filtered out")
                    else:
                        results.add_result("No _id fields leak", False, "MongoDB _id fields found in response")
                else:
                    results.add_result("No _id fields leak", True, "No channels to check")
            else:
                results.add_result("No _id fields leak", False, f"HTTP {response.status_code}")
        except Exception as e:
            results.add_result("No _id fields leak", False, f"Exception: {str(e)}")

    return results

async def test_vavoo_resolver():
    """Test vavoo stream resolver endpoint"""
    results = TestResults()
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Test vavoo URL resolution
        try:
            test_url = "https://vavoo.to/vavoo-iptv/play/17029379329ed4b84db05f"
            response = await client.post(
                f"{BACKEND_BASE_URL}/channels/resolve",
                json={"url": test_url}
            )
            if response.status_code == 200:
                data = response.json()
                if 'stream_url' in data:
                    results.add_result("POST /channels/resolve", True, f"Vavoo resolver working: {data}")
                else:
                    results.add_result("POST /channels/resolve", False, f"Missing stream_url in response: {data}")
            else:
                results.add_result("POST /channels/resolve", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            results.add_result("POST /channels/resolve", False, f"Exception: {str(e)}")

        # Test missing URL parameter
        try:
            response = await client.post(f"{BACKEND_BASE_URL}/channels/resolve", json={})
            if response.status_code == 400:
                results.add_result("Vavoo resolver error handling", True, "Correctly rejects empty URL")
            else:
                results.add_result("Vavoo resolver error handling", False, f"Expected 400, got {response.status_code}")
        except Exception as e:
            results.add_result("Vavoo resolver error handling", False, f"Exception: {str(e)}")

    return results

async def test_favorites_api():
    """Test favorites CRUD operations"""
    results = TestResults()
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        test_channel = {
            "channel_id": "test-channel-12345",
            "channel_name": "Test Channel Favorite",
            "channel_group": "Turkey", 
            "channel_url": "https://example.com/test.m3u8"
        }

        # Test 1: Get favorites (initially empty is OK)
        try:
            response = await client.get(f"{BACKEND_BASE_URL}/favorites")
            if response.status_code == 200:
                favorites = response.json()
                results.add_result("GET /favorites", True, f"Retrieved {len(favorites)} favorites")
            else:
                results.add_result("GET /favorites", False, f"HTTP {response.status_code}")
        except Exception as e:
            results.add_result("GET /favorites", False, f"Exception: {str(e)}")

        # Test 2: Add favorite
        try:
            response = await client.post(f"{BACKEND_BASE_URL}/favorites", json=test_channel)
            if response.status_code == 200:
                data = response.json()
                if 'id' in data:
                    results.add_result("POST /favorites (add)", True, "Successfully added favorite")
                else:
                    results.add_result("POST /favorites (add)", False, f"Missing id in response: {data}")
            else:
                results.add_result("POST /favorites (add)", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            results.add_result("POST /favorites (add)", False, f"Exception: {str(e)}")

        # Test 3: Add duplicate favorite (should handle gracefully)
        try:
            response = await client.post(f"{BACKEND_BASE_URL}/favorites", json=test_channel)
            if response.status_code == 200:
                data = response.json()
                if 'message' in data:
                    results.add_result("POST /favorites (duplicate check)", True, "Duplicate handled correctly")
                else:
                    results.add_result("POST /favorites (duplicate check)", True, "Duplicate allowed - behavior varies")
            else:
                results.add_result("POST /favorites (duplicate check)", False, f"HTTP {response.status_code}")
        except Exception as e:
            results.add_result("POST /favorites (duplicate check)", False, f"Exception: {str(e)}")

        # Test 4: Get favorites again (should include our test)
        try:
            response = await client.get(f"{BACKEND_BASE_URL}/favorites")
            if response.status_code == 200:
                favorites = response.json()
                found_test = any(f.get('channel_id') == test_channel['channel_id'] for f in favorites)
                if found_test:
                    results.add_result("Favorite persistence", True, "Added favorite found in list")
                else:
                    results.add_result("Favorite persistence", False, "Added favorite not found in list")
            else:
                results.add_result("Favorite persistence", False, f"HTTP {response.status_code}")
        except Exception as e:
            results.add_result("Favorite persistence", False, f"Exception: {str(e)}")

        # Test 5: Delete favorite
        try:
            response = await client.delete(f"{BACKEND_BASE_URL}/favorites/{test_channel['channel_id']}")
            if response.status_code == 200:
                results.add_result("DELETE /favorites", True, "Successfully deleted favorite")
            else:
                results.add_result("DELETE /favorites", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            results.add_result("DELETE /favorites", False, f"Exception: {str(e)}")

        # Test 6: Delete non-existent favorite
        try:
            response = await client.delete(f"{BACKEND_BASE_URL}/favorites/non-existent-id")
            if response.status_code == 404:
                results.add_result("DELETE /favorites (not found)", True, "Correctly returns 404 for non-existent favorite")
            else:
                results.add_result("DELETE /favorites (not found)", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            results.add_result("DELETE /favorites (not found)", False, f"Exception: {str(e)}")

    return results

async def test_history_api():
    """Test watch history API"""
    results = TestResults()
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        test_channel = {
            "channel_id": "test-history-12345",
            "channel_name": "Test History Channel",
            "channel_group": "Turkey",
            "channel_url": "https://example.com/history.m3u8"
        }

        # Test 1: Get history (initially empty is OK)
        try:
            response = await client.get(f"{BACKEND_BASE_URL}/history")
            if response.status_code == 200:
                history = response.json()
                results.add_result("GET /history", True, f"Retrieved {len(history)} history items")
            else:
                results.add_result("GET /history", False, f"HTTP {response.status_code}")
        except Exception as e:
            results.add_result("GET /history", False, f"Exception: {str(e)}")

        # Test 2: Add to history
        try:
            response = await client.post(f"{BACKEND_BASE_URL}/history", json=test_channel)
            if response.status_code == 200:
                data = response.json()
                if 'message' in data:
                    results.add_result("POST /history", True, "Successfully added to history")
                else:
                    results.add_result("POST /history", False, f"Unexpected response: {data}")
            else:
                results.add_result("POST /history", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            results.add_result("POST /history", False, f"Exception: {str(e)}")

        # Test 3: Get history again (should include our test and be sorted by watched_at desc)
        try:
            response = await client.get(f"{BACKEND_BASE_URL}/history")
            if response.status_code == 200:
                history = response.json()
                if history:
                    found_test = any(h.get('channel_id') == test_channel['channel_id'] for h in history)
                    if found_test:
                        results.add_result("History persistence", True, "Added history item found")
                        
                        # Check if sorted by watched_at descending
                        if len(history) > 1:
                            sorted_check = all(
                                history[i]['watched_at'] >= history[i+1]['watched_at'] 
                                for i in range(len(history)-1)
                                if 'watched_at' in history[i] and 'watched_at' in history[i+1]
                            )
                            if sorted_check:
                                results.add_result("History sorting", True, "History correctly sorted by watched_at desc")
                            else:
                                results.add_result("History sorting", False, "History not sorted correctly")
                        else:
                            results.add_result("History sorting", True, "Single item - sorting not applicable")
                    else:
                        results.add_result("History persistence", False, "Added history item not found")
                else:
                    results.add_result("History persistence", False, "No history items returned")
            else:
                results.add_result("History persistence", False, f"HTTP {response.status_code}")
        except Exception as e:
            results.add_result("History persistence", False, f"Exception: {str(e)}")

    return results

async def test_playlists_api():
    """Test playlist management API"""
    results = TestResults()
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Test 1: Get playlists (should have default playlist)
        try:
            response = await client.get(f"{BACKEND_BASE_URL}/playlists")
            if response.status_code == 200:
                playlists = response.json()
                default_playlist = any(p.get('id') == 'default' for p in playlists)
                if default_playlist:
                    results.add_result("GET /playlists", True, f"Retrieved {len(playlists)} playlists including default")
                else:
                    results.add_result("GET /playlists", False, f"Default playlist not found in {len(playlists)} playlists")
            else:
                results.add_result("GET /playlists", False, f"HTTP {response.status_code}")
        except Exception as e:
            results.add_result("GET /playlists", False, f"Exception: {str(e)}")

        # Test 2: Try to delete default playlist (should fail)
        try:
            response = await client.delete(f"{BACKEND_BASE_URL}/playlists/default")
            if response.status_code == 400:
                results.add_result("DELETE /playlists/default (protection)", True, "Correctly prevents deleting default playlist")
            else:
                results.add_result("DELETE /playlists/default (protection)", False, f"Expected 400, got {response.status_code}")
        except Exception as e:
            results.add_result("DELETE /playlists/default (protection)", False, f"Exception: {str(e)}")

        # Test 3: Try to delete non-existent playlist
        try:
            response = await client.delete(f"{BACKEND_BASE_URL}/playlists/non-existent-playlist")
            if response.status_code == 404:
                results.add_result("DELETE /playlists (not found)", True, "Correctly returns 404 for non-existent playlist")
            else:
                results.add_result("DELETE /playlists (not found)", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            results.add_result("DELETE /playlists (not found)", False, f"Exception: {str(e)}")

    return results

async def test_player_endpoint():
    """Test player page endpoint"""
    results = TestResults()
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Test player page with stream URL
        try:
            test_stream_url = "https://example.com/test.m3u8"
            response = await client.get(f"{BACKEND_BASE_URL}/player?stream_url={test_stream_url}")
            if response.status_code == 200:
                html_content = response.text
                # Check if it's valid HTML with hls.js
                if "hls.js" in html_content and "<video" in html_content and "<!DOCTYPE html>" in html_content:
                    results.add_result("GET /player", True, "Returns valid HTML page with hls.js player")
                else:
                    results.add_result("GET /player", False, "HTML doesn't contain expected player components")
            else:
                results.add_result("GET /player", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            results.add_result("GET /player", False, f"Exception: {str(e)}")

    return results

async def run_comprehensive_test():
    """Run all backend tests"""
    print("Starting comprehensive backend API testing...")
    print(f"Backend URL: {BACKEND_BASE_URL}")
    print("="*80)
    
    all_results = TestResults()
    
    # Test each API group
    test_groups = [
        ("Channels API", test_channels_api),
        ("Vavoo Resolver API", test_vavoo_resolver),
        ("Favorites API", test_favorites_api), 
        ("History API", test_history_api),
        ("Playlists API", test_playlists_api),
        ("Player Endpoint", test_player_endpoint)
    ]
    
    for group_name, test_func in test_groups:
        print(f"\n🧪 Testing {group_name}...")
        try:
            group_results = await test_func()
            # Merge results
            all_results.results.extend(group_results.results)
            all_results.failed_tests.extend(group_results.failed_tests)
            
            # Print group summary
            group_passed = len([r for r in group_results.results if r['success']])
            group_total = len(group_results.results)
            print(f"   {group_passed}/{group_total} tests passed")
        except Exception as e:
            print(f"   ❌ Group test failed: {str(e)}")
            all_results.add_result(f"{group_name} group test", False, f"Group test exception: {str(e)}")
    
    # Print final summary
    all_results.print_summary()
    return all_results

if __name__ == "__main__":
    asyncio.run(run_comprehensive_test())