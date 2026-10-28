import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";

import { CampusFaqService } from "services/campusFaqService";

function CampusFaq({ campusId }) {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedAnswers, setExpandedAnswers] = useState({});
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState(null);

  useEffect(() => {
    if (campusId) {
      loadFaqs();
    }
  }, [campusId]);

  const loadFaqs = async () => {
    try {
      setLoading(true);
      const faqData = await CampusFaqService.getCampusFaqs(campusId);
      const sortedFaqs = faqData.sort((a, b) => a.order - b.order);
      setFaqs(sortedFaqs);
    } catch (error) {
      console.error("Failed to load FAQs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFaq = async () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) return;

    try {
      const nextOrder = faqs.length > 0 ? Math.max(...faqs.map((f) => f.order)) + 1 : 1;
      const faqData = {
        campusId,
        question: newFaq.question.trim(),
        answer: newFaq.answer.trim(),
        order: nextOrder,
      };

      await CampusFaqService.createCampusFaq(faqData);
      setNewFaq({ question: "", answer: "" });
      setShowAddForm(false);
      loadFaqs();
    } catch (error) {
      console.error("Failed to add FAQ:", error);
    }
  };

  const handleEditFaq = async (id, updatedData) => {
    try {
      await CampusFaqService.updateCampusFaq(id, updatedData);
      setEditingId(null);
      loadFaqs();
    } catch (error) {
      console.error("Failed to update FAQ:", error);
    }
  };

  const handleDeleteClick = (faq) => {
    setFaqToDelete(faq);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!faqToDelete) return;

    try {
      await CampusFaqService.deleteCampusFaq(faqToDelete.id);
      setDeleteDialogOpen(false);
      setFaqToDelete(null);
      loadFaqs();
    } catch (error) {
      console.error("Failed to delete FAQ:", error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setFaqToDelete(null);
  };

  const handleDragStart = (e, faqId) => {
    setDraggedItem(faqId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, targetFaqId) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetFaqId) return;

    const draggedIndex = faqs.findIndex((f) => f.id === draggedItem);
    const targetIndex = faqs.findIndex((f) => f.id === targetFaqId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newFaqs = [...faqs];
    const draggedFaq = newFaqs[draggedIndex];
    newFaqs.splice(draggedIndex, 1);
    newFaqs.splice(targetIndex, 0, draggedFaq);

    setFaqs(newFaqs);

    for (let i = 0; i < newFaqs.length; i++) {
      const faq = newFaqs[i];
      const newOrder = i + 1;
      if (faq.order !== newOrder) {
        try {
          await CampusFaqService.updateCampusFaq(faq.id, { order: newOrder });
        } catch (error) {
          console.error("Failed to update FAQ order:", error);
        }
      }
    }

    setDraggedItem(null);
  };

  const toggleAnswerExpansion = (id) => {
    setExpandedAnswers((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const shouldCollapseAnswer = (answer) => {
    return answer.length > 20;
  };

  const getTruncatedAnswer = (answer) => {
    if (answer.length <= 20) return answer;
    return answer.substring(0, 20) + "...";
  };

  if (loading) {
    return (
      <SoftBox p={3} textAlign="center">
        <SoftTypography variant="body2" color="text">
          Loading FAQs...
        </SoftTypography>
      </SoftBox>
    );
  }

  return (
    <SoftBox>
      <SoftBox mb={3}>
        <SoftTypography variant="h6" fontWeight="medium">
          Frequently Asked Questions
        </SoftTypography>
        <SoftTypography variant="body2" color="text">
          Manage FAQ items for this location. You can add, edit, and reorder questions by dragging.
        </SoftTypography>
      </SoftBox>

      <SoftBox mb={3}>
        <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <SoftTypography variant="h6">FAQ Items</SoftTypography>
          <SoftButton
            variant="gradient"
            color="info"
            size="small"
            startIcon={<Icon>add</Icon>}
            onClick={() => setShowAddForm(true)}
          >
            Add FAQ
          </SoftButton>
        </SoftBox>
      </SoftBox>

      <SoftBox>
        {faqs.map((faq, index) => {
          const isEditing = editingId === faq.id;
          const isExpanded = expandedAnswers[faq.id];
          const shouldCollapse = shouldCollapseAnswer(faq.answer);

          if (isEditing) {
            return (
              <EditFaqForm
                key={faq.id}
                faq={faq}
                onSave={(updatedData) => handleEditFaq(faq.id, updatedData)}
                onCancel={() => setEditingId(null)}
              />
            );
          }

          return (
            <Card
              key={faq.id}
              draggable
              onDragStart={(e) => handleDragStart(e, faq.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, faq.id)}
              sx={{
                mb: 2,
                cursor: "grab",
                "&:hover": {
                  boxShadow: 2,
                },
              }}
            >
              <SoftBox p={3}>
                <Grid container spacing={2} alignItems="flex-start">
                  <Grid item xs={1}>
                    <SoftBox display="flex" alignItems="center" height="100%">
                      <SoftTypography variant="body2" fontWeight="medium" color="text">
                        {index + 1}
                      </SoftTypography>
                    </SoftBox>
                  </Grid>

                  <Grid item xs={11}>
                    <SoftBox mb={2}>
                      <SoftBox
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        gap={2}
                      >
                        <SoftBox flex={1} sx={{ minWidth: 0 }}>
                          <SoftTypography
                            variant="h4"
                            fontWeight="bold"
                            color="text"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {faq.question}
                          </SoftTypography>
                        </SoftBox>

                        <SoftBox display="flex" alignItems="center" gap={1} sx={{ flexShrink: 0 }}>
                          <Tooltip title="Edit FAQ">
                            <IconButton
                              size="small"
                              onClick={() => setEditingId(faq.id)}
                              color="info"
                            >
                              <Icon fontSize="small">edit</Icon>
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete FAQ">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(faq)}
                              color="error"
                            >
                              <Icon fontSize="small">delete</Icon>
                            </IconButton>
                          </Tooltip>
                        </SoftBox>
                      </SoftBox>
                    </SoftBox>

                    <SoftBox>
                      <SoftBox
                        display="flex"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        gap={2}
                        minHeight="60px"
                      >
                        <SoftBox flex={1} sx={{ minHeight: "40px" }}>
                          <SoftTypography
                            variant="body1"
                            color="text"
                            sx={{
                              fontStyle: "italic",
                              transition: "all 0.3s ease-in-out",
                              wordBreak: "break-word",
                              whiteSpace: "pre-wrap",
                              lineHeight: 1.5,
                            }}
                          >
                            {shouldCollapse && !isExpanded
                              ? getTruncatedAnswer(faq.answer)
                              : faq.answer}
                          </SoftTypography>
                        </SoftBox>

                        <SoftBox
                          display="flex"
                          alignItems="flex-start"
                          gap={1}
                          sx={{ flexShrink: 0, paddingTop: "4px" }}
                        >
                          {shouldCollapse && (
                            <SoftButton
                              variant="gradient"
                              color="info"
                              size="small"
                              onClick={() => toggleAnswerExpansion(faq.id)}
                              endIcon={<Icon>{isExpanded ? "expand_less" : "expand_more"}</Icon>}
                            >
                              {isExpanded ? "Show Less" : "Show More"}
                            </SoftButton>
                          )}
                        </SoftBox>
                      </SoftBox>
                    </SoftBox>
                  </Grid>
                </Grid>
              </SoftBox>
            </Card>
          );
        })}
      </SoftBox>

      {showAddForm && (
        <Card sx={{ mb: 2, mt: 2 }}>
          <SoftBox p={3}>
            <Grid container spacing={2}>
              <Grid item xs={1}>
                <SoftBox display="flex" alignItems="center" height="100%">
                  <SoftTypography variant="body2" fontWeight="medium" color="text">
                    {faqs.length + 1}
                  </SoftTypography>
                </SoftBox>
              </Grid>

              <Grid item xs={11}>
                <SoftBox mb={2}>
                  <SoftInput
                    placeholder="Enter FAQ question"
                    value={newFaq.question}
                    onChange={(e) => setNewFaq((prev) => ({ ...prev, question: e.target.value }))}
                  />
                </SoftBox>

                <SoftBox mb={2}>
                  <SoftInput
                    multiline
                    rows={3}
                    placeholder="Enter FAQ answer"
                    value={newFaq.answer}
                    onChange={(e) => setNewFaq((prev) => ({ ...prev, answer: e.target.value }))}
                  />
                </SoftBox>

                <SoftBox display="flex" justifyContent="flex-end" gap={1}>
                  <SoftButton
                    variant="text"
                    color="secondary"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewFaq({ question: "", answer: "" });
                    }}
                  >
                    Cancel
                  </SoftButton>
                  <SoftButton
                    variant="gradient"
                    color="info"
                    onClick={handleAddFaq}
                    disabled={!newFaq.question.trim() || !newFaq.answer.trim()}
                    endIcon={<Icon>save</Icon>}
                  >
                    Save
                  </SoftButton>
                </SoftBox>
              </Grid>
            </Grid>
          </SoftBox>
        </Card>
      )}

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" color="error">
            Confirm Delete
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete the FAQ{" "}
            <strong>&ldquo;{faqToDelete?.question}&rdquo;</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </SoftBox>
  );
}
function EditFaqForm({ faq, onSave, onCancel }) {
  const [editData, setEditData] = useState({
    question: faq.question,
    answer: faq.answer,
  });

  const handleSave = () => {
    onSave(editData);
  };

  return (
    <Card sx={{ mb: 2 }}>
      <SoftBox p={3}>
        <Grid container spacing={2}>
          <Grid item xs={1}>
            <SoftBox display="flex" alignItems="center" height="100%">
              <SoftTypography variant="body2" fontWeight="medium" color="text">
                {faq.order}
              </SoftTypography>
            </SoftBox>
          </Grid>

          <Grid item xs={11}>
            <SoftBox mb={2}>
              <SoftInput
                placeholder="Enter FAQ question"
                value={editData.question}
                onChange={(e) => setEditData((prev) => ({ ...prev, question: e.target.value }))}
              />
            </SoftBox>

            <SoftBox mb={2}>
              <SoftInput
                multiline
                rows={3}
                placeholder="Enter FAQ answer"
                value={editData.answer}
                onChange={(e) => setEditData((prev) => ({ ...prev, answer: e.target.value }))}
              />
            </SoftBox>

            <SoftBox display="flex" justifyContent="flex-end" gap={1}>
              <SoftButton variant="text" color="secondary" onClick={onCancel}>
                Cancel
              </SoftButton>
              <SoftButton
                variant="gradient"
                color="info"
                onClick={handleSave}
                disabled={!editData.question.trim() || !editData.answer.trim()}
                endIcon={<Icon>save</Icon>}
              >
                Save
              </SoftButton>
            </SoftBox>
          </Grid>
        </Grid>
      </SoftBox>
    </Card>
  );
}

EditFaqForm.propTypes = {
  faq: PropTypes.object.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

CampusFaq.propTypes = {
  campusId: PropTypes.string.isRequired,
};

export default CampusFaq;
