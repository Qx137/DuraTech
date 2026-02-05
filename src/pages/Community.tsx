import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Heart, Share2, Search, Plus, User, LogOut, TrendingUp, Users, Award, Clock, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  tags: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles?: { name: string };
}

interface ForumTopic {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  replies_count: number;
  views_count: number;
  created_at: string;
  profiles?: { name: string };
}

const Community = () => {
  const [newPost, setNewPost] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [posts, setPosts] = useState<Post[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    fetchPosts();
    fetchTopics();
    subscribeToChanges();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error);
      return;
    }

    // Fetch profile names separately
    if (data) {
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const postsWithProfiles = data.map(post => ({
        ...post,
        profiles: profileMap.get(post.user_id),
      }));
      setPosts(postsWithProfiles);
    }
  };

  const fetchTopics = async () => {
    const { data, error } = await supabase
      .from("forum_topics")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching topics:", error);
      return;
    }

    // Fetch profile names separately
    if (data) {
      const userIds = [...new Set(data.map(t => t.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const topicsWithProfiles = data.map(topic => ({
        ...topic,
        profiles: profileMap.get(topic.user_id),
      }));
      setTopics(topicsWithProfiles);
    }
  };

  const subscribeToChanges = () => {
    const postsChannel = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_posts" },
        () => fetchPosts()
      )
      .subscribe();

    const topicsChannel = supabase
      .channel("topics-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "forum_topics" },
        () => fetchTopics()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(topicsChannel);
    };
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
    toast.success("Logged out successfully");
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() || !user) {
      toast.error("Please log in to create a post");
      return;
    }

    const { error } = await supabase.from("community_posts").insert({
      user_id: user.id,
      content: newPost,
      tags: ["general"],
    });

    if (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
      return;
    }

    setNewPost("");
    toast.success("Post created successfully!");
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      toast.error("Please log in to like posts");
      return;
    }

    const { error } = await supabase.from("post_likes").insert({
      post_id: postId,
      user_id: user.id,
    });

    if (error) {
      if (error.code === "23505") {
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
        toast.success("Post unliked");
      } else {
        console.error("Error liking post:", error);
      }
    } else {
      toast.success("Post liked");
    }
  };

  const handleComment = (postId: string) => {
    toast.info("Comment feature coming soon!");
  };

  const handleShare = (postId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/community/post/${postId}`);
    toast.success("Post link copied to clipboard");
  };

  const handleJoinForum = (forumId: string) => {
    toast.success("You've joined this discussion");
  };

  const handleCreateTopic = () => {
    toast.info("New topic creation form coming soon!");
  };

  const handleConnect = (userId: string) => {
    toast.success("Connection request sent");
  };

  const filteredTopics = topics.filter(topic =>
    (selectedCategory === "all" || topic.category.toLowerCase().includes(selectedCategory)) &&
    (searchTerm === "" || topic.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50">
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="Durahub Logo"
              className="h-12"
            />
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/dashboard" className="text-gray-700 hover:text-green-600 transition-colors">
              Dashboard
            </Link>
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
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Durahub Community</h1>
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

          <TabsContent value="feed" className="space-y-6">
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
                <Button onClick={handleCreatePost} className="bg-green-600 hover:bg-green-700">
                  Share Post
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {posts.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                  No posts yet. Be the first to share something!
                </Card>
              ) : (
                posts.map((post) => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback><User /></AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-3">
                          <div>
                            <p className="font-semibold">{post.profiles?.name || "Anonymous"}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(post.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                          <p className="text-foreground">{post.content}</p>
                          {post.image_url && (
                            <img
                              src={post.image_url}
                              alt="Post"
                              className="rounded-lg max-h-96 w-full object-cover"
                            />
                          )}
                          <div className="flex flex-wrap gap-2">
                            {post.tags?.map((tag, i) => (
                              <Badge key={i} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-4 pt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLike(post.id)}
                              className="gap-2"
                            >
                              <Heart className="w-4 h-4" />
                              {post.likes_count}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleComment(post.id)}
                              className="gap-2"
                            >
                              <MessageCircle className="w-4 h-4" />
                              {post.comments_count}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleShare(post.id)}
                              className="gap-2"
                            >
                              <Share2 className="w-4 h-4" />
                              Share
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

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
                  <option value="farming">Farming Tips</option>
                  <option value="market">Market Updates</option>
                  <option value="sustainability">Sustainability</option>
                  <option value="technology">Technology</option>
                </select>
              </div>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleCreateTopic}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Topic
              </Button>
            </div>

            <div className="space-y-4">
              {filteredTopics.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                  No forum topics yet. Start a discussion!
                </Card>
              ) : (
                filteredTopics.map((topic) => (
                  <Card key={topic.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">{topic.title}</h3>
                            <p className="text-muted-foreground mb-3">{topic.description}</p>
                            <Badge>{topic.category}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback><User /></AvatarFallback>
                            </Avatar>
                            <span>{topic.profiles?.name || "Anonymous"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            <span>{topic.replies_count} replies</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            <span>{topic.views_count} views</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleJoinForum(topic.id)}
                          className="w-full"
                        >
                          Join Discussion
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="network" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Featured Members</CardTitle>
                <CardDescription>Connect with active community members</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-muted-foreground">
                  Network feature coming soon! You'll be able to connect with other farmers and buyers.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Community;
