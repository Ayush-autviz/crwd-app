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

export const getCommentReplies = async (commentId: string) => {
    const response = await axiosClient.get(`/social/comments/${commentId}/replies/`);
    return response.data;
};

export const createCommentReply = async (commentId: string, data: { content: string }) => {
    const response = await axiosClient.post(`/social/comments/${commentId}/replies/`, data);
    return response.data;
};

// Follow/Unfollow API endpoints
export const followUser = async (followeeId: string) => {
    const response = await axiosClient.post(`/social/users/${followeeId}/follow/`);
    return response.data;
};

export const unfollowUser = async (followeeId: string) => {
    const response = await axiosClient.delete(`/social/users/${followeeId}/unfollow/`);
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
export const getPosts = async (user_id?: string, collective_id?: string) => {
    const response = await axiosClient.get(`/social/posts/?user_id=${user_id}&collective_id=${collective_id}`);
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

export const createPostComment = async (postId: string, data: { content: string; parent_comment_id?: number }) => {
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

// Comment Like/Unlike API endpoints
export const likeComment = async (commentId: string) => {
    const response = await axiosClient.post(`/social/comments/${commentId}/like/`);
    return response.data;
};

export const unlikeComment = async (commentId: string) => {
    const response = await axiosClient.delete(`/social/comments/${commentId}/unlike/`);
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

// Cause Favorites API endpoints
export const favoriteCause = async (causeId: string) => {
    const response = await axiosClient.post(`/social/causes/${causeId}/favorite/`);
    return response.data;
};

export const unfavoriteCause = async (causeId: string) => {
    const response = await axiosClient.delete(`/social/causes/${causeId}/unfavorite/`);
    return response.data;
};

export const bulkAddCauseFavorites = async (causeIds: string[]) => {
    const response = await axiosClient.post('/social/causes/favorites/bulk-add/', {
        cause_ids: causeIds
    });
    return response.data;
};

// Collective Favorites API endpoints
export const favoriteCollective = async (collectiveId: string) => {
    const response = await axiosClient.post(`/social/collectives/${collectiveId}/favorite/`);
    return response.data;
};

export const unfavoriteCollective = async (collectiveId: string) => {
    const response = await axiosClient.delete(`/social/collectives/${collectiveId}/unfavorite/`);
    return response.data;
};

export const getFavoriteCauses = async () => {
    const response = await axiosClient.get('/social/users/favorite-causes/');
    return response.data;
};

export const getFavoriteCausesByUserId = async (userId: string) => {
    const response = await axiosClient.get(`/social/users/favorite-causes/?user_id=${userId}`);
    return response.data;
};

export const getFavoriteCollectives = async () => {
    const response = await axiosClient.get('/social/users/favorite-collectives/');
    return response.data;
};

// Get User Profile by ID
export const getUserProfileById = async (userId: string) => {
    const response = await axiosClient.get(`/social/users/${userId}/profile/`);
    return response.data;
};

// Follow User by ID
export const followUserById = async (followeeId: string) => {
    const response = await axiosClient.post(`/social/users/${followeeId}/follow/`);
    return response.data;
};

// Unfollow User by ID
export const unfollowUserById = async (followeeId: string) => {
    const response = await axiosClient.delete(`/social/users/${followeeId}/unfollow/`);
    return response.data;
};