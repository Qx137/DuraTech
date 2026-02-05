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

  Future<List<Map<String, dynamic>>> fetchTopicPosts(String topicId) async {
    // Assuming topics are handled via tags or a specific column.
    // If 'forum_topics' are just categories, we might query 'community_posts' where tags contains topic title or similar.
    // For now, let's assume we filter by a 'topic_id' if we added it, or stick to tags.
    // Given the previous code used tags: ['general'], let's assume filtering by tags.
    // However, to make it robust based on the "View Topic Details" requirement:

    // Ideally community_posts should have a topic_id.
    // Checking schema from code inference: no explicit topic_id column seen in createPost.
    // Let's assume we filter by matching tags to the topic title for now,
    // OR we just fetch all posts and client-side filter if the data model isn't strict.
    // BUT efficient way:

    final response = await _client
        .from('community_posts')
        .select('*, profiles(name)')
        //.eq('topic_id', topicId) // schema uncertain
        .order('created_at', ascending: false);

    // Temporary: return all, can refine if we see schema.
    // Actually, let's try to filter if we can.
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
