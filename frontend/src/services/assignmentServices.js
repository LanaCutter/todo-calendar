import apiClient from "./services.js";

export default {
  getAll() {
    return apiClient.get("assignments");
  },
  create(data) {
    return apiClient.post("assignments", data);
  },
  update(id, data) {
    return apiClient.put(`assignments/${id}`, data);
  },
  remove(id) {
    return apiClient.delete(`assignments/${id}`);
  },
};
