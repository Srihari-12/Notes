import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, TextField, IconButton, Button, Grid,
  Card, CardContent, CardActions, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Search as SearchIcon
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import '@fontsource/poppins';

const theme = createTheme({
  typography: { fontFamily: 'Poppins, sans-serif' },
  palette: {
    primary: { main: '#FFD700' },
    background: { default: '#FFFFFF' },
  },
});

const API_URL = 'http://localhost:8000';

const NotesPage = () => {
  const [notes, setNotes] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState({ id: null, title: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const LIMIT = 6;

  const saveToLocalStorage = (data) => localStorage.setItem('notes', JSON.stringify(data));
  const loadFromLocalStorage = () => {
    const data = localStorage.getItem('notes');
    return data ? JSON.parse(data) : null;
  };

  const fetchNotes = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/notes?skip=${page * LIMIT}&limit=${LIMIT}`);
      if (!res.ok) throw new Error('Failed to fetch notes');
      const data = await res.json();
      setNotes(data);
      saveToLocalStorage(data);
    } catch (err) {
      console.error(err);
      const localNotes = loadFromLocalStorage();
      if (localNotes) setNotes(localNotes);
      alert('Error fetching notes from server. Loaded from local storage.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchRecentNotes = async () => {
    try {
      const res = await fetch(`${API_URL}/notes/recent?limit=3`);
      if (res.ok) {
        const data = await res.json();
        setRecentNotes(data);
      }
    } catch (err) {
      console.error(err);
      console.error('Failed to fetch recent notes');
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchRecentNotes();
  }, [page, fetchNotes]);

  const handleSave = async () => {
    if (!currentNote.title.trim() || !currentNote.content.trim()) {
      alert("Please fill out both title and content.");
      return;
    }

    try {
      const method = currentNote.id !== null ? 'PUT' : 'POST';
      const url = currentNote.id !== null
        ? `${API_URL}/notes/${currentNote.id}`
        : `${API_URL}/notes/`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentNote),
      });

      if (!res.ok) throw new Error('Error saving note');

      fetchNotes();
      fetchRecentNotes();
      handleCloseDialog();
    } catch (err) {
      console.error(err);
      alert('Failed to save note.');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/notes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error deleting note');
      fetchNotes();
      fetchRecentNotes();
    } catch (err) {
      console.error(err);
      alert('Failed to delete note.');
    }
  };

  const handleEdit = (note) => {
    setCurrentNote(note);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentNote({ id: null, title: '', content: '' });
  };

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
            <Typography variant="h4" fontWeight="bold">My Notes</Typography>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              color="primary"
              onClick={() => setDialogOpen(true)}
              sx={{ borderRadius: '30px', fontWeight: 'bold' }}
            >
              Add Note
            </Button>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <SearchIcon sx={{ mr: 1, color: '#888' }} />
            <TextField
              fullWidth
              variant="standard"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ disableUnderline: true }}
            />
          </Box>

          {/* Recent Notes Section */}
          {recentNotes.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Recent Notes
              </Typography>
              <Grid container spacing={2}>
                {recentNotes.map((note) => (
                  <Grid item xs={12} sm={4} key={note.id}>
                    <Card sx={{ backgroundColor: '#FFF3CD' }}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold">{note.title}</Typography>
                        <Typography variant="body2">{note.content.slice(0, 80)}...</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Notes List */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Grid container spacing={3}>
                {filteredNotes.map((note) => (
                  <Grid item xs={12} sm={6} key={note.id}>
                    <Card variant="outlined" sx={{ borderRadius: 3, backgroundColor: '#FFFBE6' }}>
                      <CardContent>
                        <Typography variant="h6" fontWeight="bold">{note.title}</Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>{note.content}</Typography>
                      </CardContent>
                      <CardActions>
                        <IconButton onClick={() => handleEdit(note)}><EditIcon /></IconButton>
                        <IconButton onClick={() => handleDelete(note.id)}><DeleteIcon /></IconButton>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Pagination Controls */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  variant="outlined"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outlined"
                  disabled={notes.length < LIMIT}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </Box>
            </>
          )}

          {/* Dialog for Adding/Editing */}
          <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
            <DialogTitle>{currentNote.id !== null ? 'Edit Note' : 'Add Note'}</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth label="Title" variant="standard" value={currentNote.title}
                onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth label="Content" variant="standard" multiline rows={4}
                value={currentNote.content}
                onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button variant="contained" color="primary" onClick={handleSave}>Save</Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default NotesPage;
