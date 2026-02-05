import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../services/storage_service.dart';
import '../../theme/app_colors.dart';

class DriverDocsScreen extends StatefulWidget {
  const DriverDocsScreen({super.key});

  @override
  State<DriverDocsScreen> createState() => _DriverDocsScreenState();
}

class _DriverDocsScreenState extends State<DriverDocsScreen> {
  final _storageService = StorageService();
  final _picker = ImagePicker();

  final Map<String, File?> _files = {
    'license': null,
    'insurance': null,
    'vehicle_reg': null,
  };

  final Map<String, bool> _uploading = {
    'license': false,
    'insurance': false,
    'vehicle_reg': false,
  };

  final Map<String, bool> _completed = {
    'license': false,
    'insurance': false,
    'vehicle_reg': false,
  };

  Future<void> _uploadDoc(String type) async {
    final pickedFile = await _picker.pickImage(source: ImageSource.gallery);
    if (pickedFile == null) return;

    final file = File(pickedFile.path);
    setState(() {
      _files[type] = file;
      _uploading[type] = true;
    });

    try {
      // In a real app, we'd also save the URL to the driver's profile in the DB
      await _storageService.uploadDriverDoc(file, type);

      if (mounted) {
        setState(() {
          _uploading[type] = false;
          _completed[type] = true;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Document uploaded successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _uploading[type] = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Driver Documents')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Please upload the following documents to verify your account.',
            style: TextStyle(fontSize: 16, color: Colors.grey),
          ),
          const SizedBox(height: 24),
          _buildDocItem('Driver License', 'license'),
          _buildDocItem('Insurance Policy', 'insurance'),
          _buildDocItem('Vehicle Registration', 'vehicle_reg'),
          const SizedBox(height: 32),
          if (_completed.values.every((v) => v))
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.green[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.green),
              ),
              child: const Row(
                children: [
                  Icon(Icons.check_circle, color: Colors.green),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'All documents uploaded! Your account is under review.',
                      style: TextStyle(
                          color: Colors.green, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildDocItem(String label, String key) {
    final isCompleted = _completed[key]!;
    final isUploading = _uploading[key]!;
    final file = _files[key];

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            color: isCompleted ? AppColors.emerald : Colors.grey[200],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            isCompleted ? Icons.check : Icons.upload_file,
            color: isCompleted ? Colors.white : Colors.grey,
          ),
        ),
        title: Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(
          isCompleted
              ? 'Uploaded'
              : isUploading
                  ? 'Uploading...'
                  : 'Tap to upload',
          style: TextStyle(
            color: isCompleted ? AppColors.emerald : Colors.grey,
          ),
        ),
        trailing: isUploading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2))
            : const Icon(Icons.chevron_right),
        onTap: isUploading ? null : () => _uploadDoc(key),
      ),
    );
  }
}
