import 'package:flutter/material.dart';
import '../../services/community_service.dart';
import '../../theme/app_colors.dart';
import 'new_post_screen.dart';

class TopicDetailScreen extends StatefulWidget {
  final Map<String, dynamic> topic;
  const TopicDetailScreen({super.key, required this.topic});

  @override
  State<TopicDetailScreen> createState() => _TopicDetailScreenState();
}

class _TopicDetailScreenState extends State<TopicDetailScreen> {
  final _service = CommunityService();
  bool _isLoading = true;
  List<Map<String, dynamic>> _posts = [];

  @override
  void initState() {
    super.initState();
    _loadPosts();
  }

  Future<void> _loadPosts() async {
    try {
      final posts = await _service.fetchTopicPosts(widget.topic['id']);
      if (mounted) {
        setState(() {
          _posts = posts;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 200.0,
            floating: false,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(widget.topic['title'],
                  style: const TextStyle(color: Colors.white, fontSize: 16)),
              background: Container(
                color: AppColors.emerald,
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(height: 32),
                        const Icon(Icons.forum,
                            size: 48, color: Colors.white70),
                        const SizedBox(height: 8),
                        Text(
                          widget.topic['description'],
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: Colors.white70),
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
          if (_isLoading)
            const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_posts.isEmpty)
            const SliverFillRemaining(
              child: Center(child: Text('No posts in this topic yet')),
            )
          else
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final post = _posts[index];
                  return Card(
                    margin:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: ListTile(
                      leading: CircleAvatar(
                        child: Text(post['profiles']?['name']?[0] ?? 'U'),
                      ),
                      title: Text(
                        post['profiles']?['name'] ?? 'User',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      subtitle: Text(
                        post['content'],
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  );
                },
                childCount: _posts.length,
              ),
            ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => NewPostScreen(
                topicId: widget.topic['id'],
                topicTitle: widget.topic['title'],
              ),
            ),
          );
          if (result == true) {
            _loadPosts();
          }
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
