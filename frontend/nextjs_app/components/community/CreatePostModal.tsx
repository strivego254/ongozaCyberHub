"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import type { CreatePostData, PostType } from "@/types/community"

interface CreatePostModalProps {
  open: boolean
  onClose: () => void
  onPost: (data: CreatePostData) => Promise<void>
  communityId: string
}

export function CreatePostModal({
  open,
  onClose,
  onPost,
  communityId,
}: CreatePostModalProps) {
  const [postType, setPostType] = useState<PostType>("text")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    try {
      const postData: CreatePostData = {
        community_id: communityId,
        post_type: postType,
        content: content.trim(),
        tags: tags,
      }

      if (title.trim()) {
        postData.title = title.trim()
      }

      await onPost(postData)
      handleClose()
    } catch (error: any) {
      console.error("Error creating post:", error)
      alert(error.message || "Failed to create post")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTitle("")
    setContent("")
    setTags([])
    setTagInput("")
    setPostType("text")
    onClose()
  }

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, "")
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
          <DialogDescription>
            Share your thoughts, achievements, or start a discussion
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Post Type Selector */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Post Type
            </label>
            <div className="flex gap-2 flex-wrap">
              {(['text', 'media', 'event', 'achievement', 'poll'] as PostType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPostType(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    postType === type
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {type === 'achievement' ? '🏆' : type === 'event' ? '📅' : type === 'media' ? '📸' : type === 'poll' ? '📊' : '📝'} {type}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Title {postType !== 'text' && '(Optional)'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter post title..."
            />
          </div>

          {/* Content */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="What's on your mind?..."
              required
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Add tags (press Enter)"
              />
              <Button
                type="button"
                variant="defender"
                size="sm"
                onClick={addTag}
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="steel"
                    className="cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    #{tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="defender"
              disabled={loading || !content.trim()}
            >
              {loading ? "Posting..." : "Post"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

