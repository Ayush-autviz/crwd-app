import axiosClient from "../../lib/react-query/axiosClient";

// Comments API endpoints
export const getComments = async () => {
    const response = await axiosClient.get('/social/comments/');
    return response.data;
};

export const createComment = async (data: any) => {
    const response = await axiosClient.post('/social/comments/', data);
    return response.data;
};

export const getCommentById = async (id: string) => {
    const response = await axiosClient.get(`/social/comments/${id}/`);
    return response.data;
};

export const updateComment = async (id: string, data: any) => {
    const response = await axiosClient.put(`/social/comments/${id}/`, data);
    return response.data;
};

export const patchComment = async (id: string, data: any) => {
    const response = await axiosClient.patch(`/social/comments/${id}/`, data);
    return response.data;
};

export const deleteComment = async (id: string) => {
    const response = await axiosClient.delete(`/social/comments/${id}/`);
    return response.data;
};

// Follow/Unfollow API endpoints
export const followUser = async (followeeId: string) => {
    const response = await axiosClient.post(`/social/follow/${followeeId}/`);
    return response.data;
};

export const unfollowUser = async (followeeId: string) => {
    const response = await axiosClient.delete(`/social/unfollow/${followeeId}/`);
    return response.data;
};

// Likes API endpoints
export const getLikes = async () => {
    const response = await axiosClient.get('/social/likes/');
    return response.data;
};

export const createLike = async (data: any) => {
    const response = await axiosClient.post('/social/likes/', data);
    return response.data;
};

export const deleteLike = async (id: string) => {
    const response = await axiosClient.delete(`/social/likes/${id}/`);
    return response.data;
};

// Posts API endpoints
export const getPosts = async () => {
    const response = await axiosClient.get('/social/posts/');
    return response.data;
};

export const createPost = async (data: any) => {
    const response = await axiosClient.post('/social/posts/', data);
    return response.data;
};

export const getPostById = async (id: string) => {
    const response = await axiosClient.get(`/social/posts/${id}/`);
    return response.data;
};

export const updatePost = async (id: string, data: any) => {
    const response = await axiosClient.put(`/social/posts/${id}/`, data);
    return response.data;
};

export const patchPost = async (id: string, data: any) => {
    const response = await axiosClient.patch(`/social/posts/${id}/`, data);
    return response.data;
};

export const deletePost = async (id: string) => {
    const response = await axiosClient.delete(`/social/posts/${id}/`);
    return response.data;
};

// Post Comments API endpoints
export const getPostComments = async (postId: string) => {
    const response = await axiosClient.get(`/social/posts/${postId}/comments/`);
    return response.data;
};

export const createPostComment = async (postId: string, data: any) => {
    const response = await axiosClient.post(`/social/posts/${postId}/comments/`, data);
    return response.data;
};

// Post Like/Unlike API endpoints
export const likePost = async (postId: string) => {
    const response = await axiosClient.post(`/social/posts/${postId}/like/`);
    return response.data;
};

export const unlikePost = async (postId: string) => {
    const response = await axiosClient.delete(`/social/posts/${postId}/unlike/`);
    return response.data;
};

// User Followers/Following API endpoints
export const getUserFollowers = async (userId: string) => {
    const response = await axiosClient.get(`/social/users/${userId}/followers/`);
    return response.data;
};

export const getUserFollowing = async (userId: string) => {
    const response = await axiosClient.get(`/social/users/${userId}/following/`);
    return response.data;
};
