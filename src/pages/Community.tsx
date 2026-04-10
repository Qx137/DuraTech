import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Heart, Share2, Search, Plus, User, LogOut, TrendingUp, Users, Award, Clock, MessageSquare, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import NotchHeader from "@/components/layout/NotchHeader";

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

interface Member {
  id: string;
  name: string;
  user_type: string;
  business_name?: string;
}

const Community = () => {
  const [newPost, setNewPost] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [posts, setPosts] = useState<Post[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    fetchPosts();
    fetchTopics();
    fetchMembers();
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

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, user_type, business_name")
      .limit(30);

    if (error) {
      console.error("Error fetching members:", error);
      return;
    }
    setMembers(data || []);
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
      <NotchHeader
        navItems={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Marketplace", to: "/marketplace" },
          { label: "Community", to: "/community", active: true },
          { label: "DuraGo", to: "/delivery" },
          { label: "AI Tools", to: "/ai-tools" },
        ]}
        actions={
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>
        }
      />

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
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input placeholder="Search members..." className="pl-10" />
              </div>
              <div className="flex gap-2">
                <select className="px-3 py-2 border rounded-md text-sm">
                  <option value="all">All Roles</option>
                  <option value="farmer">Farmers</option>
                  <option value="buyer">Buyers</option>
                  <option value="driver">Drivers</option>
                </select>
              </div>
            </div>

            {members.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No members found yet. Be the first to join!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {members.map((member) => (
                  <Card key={member.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                      <Avatar className="h-20 w-20">
                        <AvatarFallback className="text-xl bg-green-100 text-green-700">
                          {member.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1 w-full">
                        <h3 className="font-semibold text-lg truncate" title={member.name}>
                          {member.name}
                        </h3>
                        <Badge variant="secondary" className="capitalize">
                          {member.user_type}
                        </Badge>
                        {member.business_name && (
                          <p className="text-xs text-muted-foreground truncate w-full" title={member.business_name}>
                            {member.business_name}
                          </p>
                        )}
                      </div>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleConnect(member.id)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Connect
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Community;
