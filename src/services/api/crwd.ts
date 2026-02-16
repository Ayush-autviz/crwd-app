import axiosClient from "../../lib/react-query/axiosClient";

// Causes API endpoints
export const getCauses = async () => {
    const response = await axiosClient.get('/crwd/causes/');
    return response.data;
};

// Causes API endpoints
export const getCausesBySearch = async (search?: string, category?: string, page?: number) => {
    // Normalizing curly apostrophes from mobile keyboards
    const normalizedSearch = search ? search.replace(/[’‘]/g, "'").trim() : '';
    const encodedSearch = encodeURIComponent(normalizedSearch);
    const encodedCategory = category ? encodeURIComponent(category) : '';
    const response = await axiosClient.get(`/crwd/causes/?search=${encodedSearch}&category=${encodedCategory}&page=${page}`);
    return response.data;
};

export const getCausesByLocation = async (latitude: number, longitude: number) => {
    const response = await axiosClient.get(`/crwd/causes/?lat=${latitude}&lng=${longitude}`);
    return response.data;
};

export const createCause = async (data: any) => {
    const response = await axiosClient.post('/crwd/causes/', data);
    return response.data;
};

export const getCauseById = async (id: string) => {
    const response = await axiosClient.get(`/crwd/causes/${id}/`);
    return response.data;
};

export const updateCause = async (id: string, data: any) => {
    const response = await axiosClient.put(`/crwd/causes/${id}/`, data);
    return response.data;
};

export const patchCause = async (id: string, data: any) => {
    const response = await axiosClient.patch(`/crwd/causes/${id}/`, data);
    return response.data;
};

export const deleteCause = async (id: string) => {
    const response = await axiosClient.delete(`/crwd/causes/${id}/`);
    return response.data;
};

export const requestCause = async (data: { name: string; ein_number: string; description: string }) => {
    const response = await axiosClient.post('/crwd/request-cause/', data);
    return response.data;
};

// Collectives API endpoints
export const getCollectives = async () => {
    const response = await axiosClient.get('/crwd/collectives/');
    return response.data;
};

export const createCollective = async (data: any) => {
    const response = await axiosClient.post('/crwd/collectives/', data);
    return response.data;
};

export const getCollectiveById = async (id: string) => {
    const response = await axiosClient.get(`/crwd/collectives/${id}/`);
    return response.data;
};

export const updateCollective = async (id: string, data: any) => {
    const response = await axiosClient.put(`/crwd/collectives/${id}/`, data);
    return response.data;
};

export const patchCollective = async (id: string, data: any) => {
    const response = await axiosClient.patch(`/crwd/collectives/${id}/`, data);
    return response.data;
};

export const deleteCollective = async (id: string) => {
    const response = await axiosClient.delete(`/crwd/collectives/${id}/`);
    return response.data;
};

// Collective Causes API endpoints
export const getCollectiveCauses = async (id: string) => {
    const response = await axiosClient.get(`/crwd/collectives/${id}/causes/`);
    return response.data;
};

export const createCollectiveCause = async (id: string, data: any) => {
    const response = await axiosClient.post(`/crwd/collectives/${id}/causes/`, data);
    return response.data;
};

export const getCollectiveCauseById = async (id: string, causePk: string) => {
    const response = await axiosClient.get(`/crwd/collectives/${id}/causes/${causePk}/`);
    return response.data;
};

export const deleteCollectiveCause = async (id: string, causePk: string) => {
    const response = await axiosClient.delete(`/crwd/collectives/${id}/causes/${causePk}/`);
    return response.data;
};

// Collective Actions API endpoints
export const joinCollective = async (id: string) => {
    const response = await axiosClient.post(`/crwd/collectives/${id}/join/`);
    return response.data;
};

export const getJoinCollective = async (userId: string) => {
    const response = await axiosClient.get(`/crwd/joined-collectives/?user_id=${userId}`);
    return response.data;
};

export const leaveCollective = async (id: string) => {
    const response = await axiosClient.post(`/crwd/collectives/${id}/leave/`);
    return response.data;
};

// Collective Members API endpoints
export const getCollectiveMembers = async (id: string) => {
    const response = await axiosClient.get(`/crwd/collectives/${id}/members/`);
    return response.data;
};

export const addCollectiveMember = async (id: string, data: any) => {
    const response = await axiosClient.post(`/crwd/collectives/${id}/members/`, data);
    return response.data;
};

export const getCollectiveMemberById = async (id: string, memberPk: string) => {
    const response = await axiosClient.get(`/crwd/collectives/${id}/members/${memberPk}/`);
    return response.data;
};

export const updateCollectiveMember = async (id: string, memberPk: string, data: any) => {
    const response = await axiosClient.put(`/crwd/collectives/${id}/members/${memberPk}/`, data);
    return response.data;
};

export const patchCollectiveMember = async (id: string, memberPk: string, data: any) => {
    const response = await axiosClient.patch(`/crwd/collectives/${id}/members/${memberPk}/`, data);
    return response.data;
};

export const deleteCollectiveMember = async (id: string, memberPk: string) => {
    const response = await axiosClient.delete(`/crwd/collectives/${id}/members/${memberPk}/`);
    return response.data;
};

// Collective Stats API endpoint
export const getCollectiveStats = async (id: string) => {
    const response = await axiosClient.get(`/crwd/collectives/${id}/stats/`);
    return response.data;
};

// User Collectives API endpoint
export const getUserCollectives = async () => {
    const response = await axiosClient.get('/crwd/user/collectives/');
    return response.data;
};

//  suggested crwd
export const getSuggestedCrwds = async (id: any) => {
    const response = await axiosClient.get(`/crwd/collectives/${id}/suggested/`);
    return response.data;
};

// Collective Donation History API endpoint
export const getCollectiveDonationHistory = async (id: any) => {
    const response = await axiosClient.get(`/crwd/collectives/${id}/donations/`);
    return response.data;
};

// Surprise Me API endpoint
export const getSurpriseMe = async (categories?: string[] | string) => {
    let categoriesParam = '';
    if (categories) {
        if (Array.isArray(categories)) {
            categoriesParam = categories.length > 0 ? categories.join(',') : '';
        } else {
            categoriesParam = categories;
        }
    }
    const encodedCategories = categoriesParam ? encodeURIComponent(categoriesParam) : '';
    const url = encodedCategories
        ? `/crwd/causes/surprise-me/?categories=${encodedCategories}`
        : '/crwd/causes/surprise-me/';
    const response = await axiosClient.get(url);
    return response.data;
};

// Fundraiser API endpoints
export const createFundraiser = async (data: any) => {
    const response = await axiosClient.post('/crwd/fundraisers/', data);
    return response.data;
};

export const getFundraiserById = async (id: string) => {
    const response = await axiosClient.get(`/crwd/fundraisers/${id}/`);
    return response.data;
};

export const patchFundraiser = async (id: string, data: any) => {
    const response = await axiosClient.patch(`/crwd/fundraisers/${id}/`, data);
    return response.data;
};

export const putFundraiser = async (id: string, data: any) => {
    const response = await axiosClient.put(`/crwd/fundraisers/${id}/`, data);
    return response.data;
};