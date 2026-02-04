import '../core/supabase_client.dart';

class CommunityService {
  final _client = SupabaseConfig.client;

  Future<List<Map<String, dynamic>>> fetchPosts() async {
    final response = await _client
        .from('community_posts')
        .select('*, profiles(name)')
        .order('created_at', ascending: false);
    return List<Map<String, dynamic>>.from(response);
  }

  Future<List<Map<String, dynamic>>> fetchTopics() async {
    final response = await _client
        .from('forum_topics')
        .select('*, profiles(name)')
        .order('updated_at', ascending: false);
    return List<Map<String, dynamic>>.from(response);
  }

  Future<void> createPost(String content) async {
    final user = _client.auth.currentUser;
    if (user == null) throw Exception('User not logged in');

    await _client.from('community_posts').insert({
      'user_id': user.id,
      'content': content,
      'tags': ['general'],
    });
  }

  Stream<List<Map<String, dynamic>>> postStream() {
    return _client
        .from('community_posts')
        .stream(primaryKey: ['id'])
        .order('created_at', ascending: false)
        .map((data) => List<Map<String, dynamic>>.from(data));
  }

  Future<List<Map<String, dynamic>>> fetchComments(String postId) async {
    final response = await _client
        .from('post_comments')
        .select('*, profiles(name)')
        .eq('post_id', postId)
        .order('created_at', ascending: false);
    return List<Map<String, dynamic>>.from(response);
  }

  Future<void> addComment(String postId, String content) async {
    final user = _client.auth.currentUser;
    if (user == null) throw Exception('User not logged in');

    await _client.from('post_comments').insert({
      'user_id': user.id,
      'post_id': postId,
      'content': content,
    });
  }

  Future<void> toggleLike(String postId) async {
    final user = _client.auth.currentUser;
    if (user == null) throw Exception('User not logged in');

    // Check if already liked
    final existing = await _client
        .from('post_likes')
        .select()
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

    if (existing != null) {
      await _client
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
    } else {
      await _client.from('post_likes').insert({
        'post_id': postId,
        'user_id': user.id,
      });
    }
  }
}
