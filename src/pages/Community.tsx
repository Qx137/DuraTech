
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MessageSquare, Users, TrendingUp, Clock, Heart, MessageCircle, Share2, Plus, Leaf, Award, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Sample community data
const forumTopics = [
  {
    id: 1,
    title: "Best Practices for Organic Farming",
    description: "Share your tips and experiences with organic farming methods",
    author: "Sarah Johnson",
    authorType: "seller",
    replies: 24,
    views: 156,
    lastActivity: "2 hours ago",
    category: "Farming Tips",
    pinned: true
  },
  {
    id: 2,
    title: "Seasonal Produce Availability",
    description: "What's in season in your area? Let's help buyers find fresh produce",
    author: "Mike Chen",
    authorType: "buyer",
    replies: 18,
    views: 89,
    lastActivity: "5 hours ago",
    category: "Market Updates"
  },
  {
    id: 3,
    title: "Sustainable Packaging Solutions",
    description: "Eco-friendly packaging ideas for farm-to-table delivery",
    author: "Green Valley Farm",
    authorType: "seller",
    replies: 12,
    views: 67,
    lastActivity: "1 day ago",
    category: "Sustainability"
  }
];

const communityPosts = [
  {
    id: 1,
    author: "Emma Wilson",
    authorType: "seller",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b9a4d90b?w=100&h=100&fit=crop&crop=face",
    content: "Just harvested the most beautiful tomatoes this season! The organic methods really make a difference in taste and quality. 🍅",
    image: "https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=400&h=300&fit=crop",
    likes: 23,
    comments: 8,
    timeAgo: "3 hours ago",
    tags: ["organic", "tomatoes", "harvest"],
    liked: false
  },
  {
    id: 2,
    author: "David Rodriguez",
    authorType: "buyer",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    content: "Looking for reliable suppliers of leafy greens in the California area. Quality and consistency are key for my restaurant chain.",
    likes: 15,
    comments: 12,
    timeAgo: "6 hours ago",
    tags: ["leafy-greens", "california", "restaurant"],
    liked: false
  },
  {
    id: 3,
    author: "Organic Acres Farm",
    authorType: "seller",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    content: "Excited to announce our new greenhouse facility! We'll be able to provide fresh produce year-round now. Sustainability is our priority! 🌱",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop",
    likes: 41,
    comments: 15,
    timeAgo: "1 day ago",
    tags: ["greenhouse", "sustainability", "year-round"],
    liked: false
  }
];

const Community = () => {
  const [newPost, setNewPost] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [posts, setPosts] = useState(communityPosts);
  const [topics, setTopics] = useState(forumTopics);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicDescription, setNewTopicDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account.",
    });
  };

  const handleCreatePost = () => {
    if (newPost.trim()) {
      const newPostData = {
        id: posts.length + 1,
        author: "You",
        authorType: "seller",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        content: newPost,
        likes: 0,
        comments: 0,
        timeAgo: "Just now",
        tags: ["new"],
        liked: false
      };
      setPosts([newPostData, ...posts]);
      toast({
        title: "Post Created!",
        description: "Your post has been shared with the community.",
      });
      setNewPost("");
    }
  };

  const handleLike = (postId: number) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
    toast({
      title: "Post Liked!",
      description: "You liked this post.",
    });
  };

  const handleJoinForum = (topicId: number) => {
    toast({
      title: "Joined Discussion!",
      description: "You've joined this forum topic.",
    });
  };

  const handleCreateTopic = () => {
    if (newTopicTitle.trim() && newTopicDescription.trim()) {
      const newTopic = {
        id: topics.length + 1,
        title: newTopicTitle,
        description: newTopicDescription,
        author: "You",
        authorType: "seller",
        replies: 0,
        views: 0,
        lastActivity: "Just now",
        category: "General",
        pinned: false
      };
      setTopics([newTopic, ...topics]);
      setNewTopicTitle("");
      setNewTopicDescription("");
      toast({
        title: "Topic Created!",
        description: "Your forum topic has been created.",
      });
    }
  };

  const handleConnect = (memberName: string) => {
    toast({
      title: "Connection Sent!",
      description: `Connection request sent to ${memberName}`,
    });
  };

  const filteredTopics = topics.filter(topic => 
    (selectedCategory === "all" || topic.category.toLowerCase().includes(selectedCategory)) &&
    (searchTerm === "" || topic.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Leaf className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-green-800">DuraMarket</h1>
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/marketplace" className="text-gray-700 hover:text-green-600 transition-colors">
              Marketplace
            </Link>
            <Link to="/community" className="text-green-600 font-medium">
              Community
            </Link>
            <Link to="/ai-tools" className="text-gray-700 hover:text-green-600 transition-colors">
              AI Tools
            </Link>
          </nav>
          <div className="flex items-center space-x-3">
            <Link to="/dashboard">
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                Dashboard
              </Button>
            </Link>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">DuraMarket Community</h1>
          <p className="text-gray-600">Connect with farmers, buyers, and agriculture enthusiasts</p>
        </div>

        <Tabs defaultValue="feed" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="feed" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Community Feed</span>
            </TabsTrigger>
            <TabsTrigger value="forums" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Forums</span>
            </TabsTrigger>
            <TabsTrigger value="network" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Network</span>
            </TabsTrigger>
          </TabsList>

          {/* Community Feed */}
          <TabsContent value="feed" className="space-y-6">
            {/* Create Post */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Share with the Community</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="What's happening in your farm or business?"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">#farming</Badge>
                    <Badge variant="outline">#organic</Badge>
                    <Badge variant="outline">#sustainable</Badge>
                  </div>
                  <Button onClick={handleCreatePost} className="bg-green-600 hover:bg-green-700">
                    Share Post
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Community Posts */}
            <div className="space-y-6">
              {posts.map(post => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar>
                        <AvatarImage src={post.avatar} alt={post.author} />
                        <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{post.author}</h3>
                          <Badge variant={post.authorType === 'seller' ? 'default' : 'secondary'} className="text-xs">
                            {post.authorType === 'seller' ? '🌾 Seller' : '🛒 Buyer'}
                          </Badge>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">{post.timeAgo}</span>
                        </div>
                        
                        <p className="text-gray-700">{post.content}</p>
                        
                        {post.image && (
                          <img 
                            src={post.image} 
                            alt="Post image" 
                            className="rounded-lg max-w-md h-48 object-cover"
                          />
                        )}
                        
                        <div className="flex flex-wrap gap-2">
                          {post.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center space-x-6 pt-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleLike(post.id)}
                            className={`flex items-center space-x-2 ${post.liked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'}`}
                          >
                            <Heart className={`h-4 w-4 ${post.liked ? 'fill-current' : ''}`} />
                            <span>{post.likes}</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-gray-600">
                            <MessageCircle className="h-4 w-4" />
                            <span>{post.comments}</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-gray-600">
                            <Share2 className="h-4 w-4" />
                            <span>Share</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Forums */}
          <TabsContent value="forums" className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search forums..." 
                    className="pl-10 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Categories</option>
                  <option value="farming-tips">Farming Tips</option>
                  <option value="market-updates">Market Updates</option>
                  <option value="sustainability">Sustainability</option>
                  <option value="technology">Technology</option>
                </select>
              </div>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  const title = prompt("Enter topic title:");
                  const description = prompt("Enter topic description:");
                  if (title && description) {
                    setNewTopicTitle(title);
                    setNewTopicDescription(description);
                    handleCreateTopic();
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Topic
              </Button>
            </div>

            <div className="space-y-4">
              {filteredTopics.map(topic => (
                <Card key={topic.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          {topic.pinned && <Award className="h-4 w-4 text-yellow-500" />}
                          <h3 className="text-lg font-semibold hover:text-green-600 cursor-pointer">
                            {topic.title}
                          </h3>
                          <Badge variant="outline">{topic.category}</Badge>
                        </div>
                        <p className="text-gray-600">{topic.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>By {topic.author}</span>
                          <Badge variant={topic.authorType === 'seller' ? 'default' : 'secondary'} className="text-xs">
                            {topic.authorType === 'seller' ? '🌾' : '🛒'}
                          </Badge>
                          <span>•</span>
                          <span className="flex items-center space-x-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>{topic.replies} replies</span>
                          </span>
                          <span>•</span>
                          <span>{topic.views} views</span>
                          <span>•</span>
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{topic.lastActivity}</span>
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleJoinForum(topic.id)}
                      >
                        Join Discussion
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Network */}
          <TabsContent value="network" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Featured Community Members</CardTitle>
                <CardDescription>Connect with active farmers and buyers in your area</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      name: "Green Valley Farm",
                      type: "seller",
                      location: "California, USA",
                      specialty: "Organic Vegetables",
                      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face"
                    },
                    {
                      name: "Fresh Foods Restaurant",
                      type: "buyer",
                      location: "New York, USA",
                      specialty: "Farm-to-Table Dining",
                      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
                    },
                    {
                      name: "Sunrise Orchards",
                      type: "seller",
                      location: "Washington, USA",
                      specialty: "Premium Fruits",
                      avatar: "https://images.unsplash.com/photo-1494790108755-2616b9a4d90b?w=100&h=100&fit=crop&crop=face"
                    }
                  ].map((member, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 text-center">
                        <Avatar className="w-16 h-16 mx-auto mb-3">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold">{member.name}</h3>
                        <Badge variant={member.type === 'seller' ? 'default' : 'secondary'} className="text-xs mb-2">
                          {member.type === 'seller' ? '🌾 Seller' : '🛒 Buyer'}
                        </Badge>
                        <p className="text-sm text-gray-600 mb-1">{member.location}</p>
                        <p className="text-sm text-gray-500 mb-3">{member.specialty}</p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleConnect(member.name)}
                        >
                          Connect
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Community;
