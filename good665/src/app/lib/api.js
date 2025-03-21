import axios from "axios";

const API_URL = "http://localhost:8081/api/v1/notices";

export const getNotices = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const getNoticeById = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};

export const createNotice = async (notice) => {
    const response = await axios.post(API_URL, notice);
    return response.data;
};

export const deleteNotice = async (id) => {
    await axios.delete(`${API_URL}/${id}`);
};