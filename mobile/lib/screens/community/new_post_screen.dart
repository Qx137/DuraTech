import 'package:flutter/material.dart';
import '../../services/community_service.dart';
import '../../theme/app_colors.dart';

class NewPostScreen extends StatefulWidget {
  final String topicId;
  final String topicTitle;

  const NewPostScreen({
    super.key,
    required this.topicId,
    required this.topicTitle,
  });

  @override
  State<NewPostScreen> createState() => _NewPostScreenState();
}

class _NewPostScreenState extends State<NewPostScreen> {
  final _service = CommunityService();
  final _contentController = TextEditingController();
  bool _isLoading = false;

  Future<void> _handlePost() async {
    final content = _contentController.text.trim();
    if (content.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter some content')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      await _service.createTopicReply(widget.topicId, content);
      if (mounted) {
        Navigator.pop(context, true); // Return true to indicate success
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Post added!')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  @override
  void dispose() {
    _contentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Post in ${widget.topicTitle}',
          style: const TextStyle(fontSize: 18),
        ),
        actions: [
          if (!_isLoading)
            TextButton(
              onPressed: _handlePost,
              child: const Text(
                'POST',
                style: TextStyle(
                  color: AppColors.emerald,
                  fontWeight: FontWeight.bold,
                ),
              ),
            )
          else
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 16.0),
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: TextField(
          controller: _contentController,
          autofocus: true,
          maxLines: null,
          decoration: const InputDecoration(
            hintText: 'Share your thoughts...',
            border: InputBorder.none,
          ),
          style: const TextStyle(fontSize: 16, height: 1.5),
        ),
      ),
    );
  }
}
