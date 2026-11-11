import apiClient from "./services.js";

export default {
  getAll() {
    return apiClient.get("classes");
  },
  create(data) {
    return apiClient.post("classes", data);
  },
  update(id, data) {
    return apiClient.put(`classes/${id}`, data);
  },
  remove(id) {
    return apiClient.delete(`classes/${id}`);
  },
};
