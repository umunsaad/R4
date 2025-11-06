import { useState, useEffect } from 'react';
import api from '../api/client';
import type { Video } from '../../types';

interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string;
  lesson_count: number;
}

interface Lesson {
  id: number;
  course_id: number;
  title: string;
  description: string;
  youtube_video_id: string;
  order_index: number;
  completed: number;
}

interface UseCoursesProps {
  enabled?: boolean;
}

export function useCourses(props: UseCoursesProps = {}) {
  const { enabled = true } = props;
  const [courses, setCourses] = useState<Record<string, Video[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCoursesAndLessons = async () => {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('[useCourses] No token found, skipping courses fetch');
      setLoading(false);
      setCourses({});
      return;
    }

    try {
      console.log('[useCourses] Fetching courses...');
      const coursesResponse = await api.get<Course[]>('/courses');
      const coursesData = coursesResponse.data;

      console.log(`[useCourses] Found ${coursesData.length} courses`);

      const coursesWithLessons: Record<string, Video[]> = {};

      for (const course of coursesData) {
        try {
          const lessonsResponse = await api.get<Lesson[]>(`/courses/${course.id}/lessons`);
          const lessons = lessonsResponse.data;

          const videos: Video[] = lessons.map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            description: lesson.description || '',
            duration: 'N/A',
            thumbnail: course.thumbnail_url || `https://img.youtube.com/vi/${lesson.youtube_video_id}/hqdefault.jpg`,
            videoUrl: `https://www.youtube.com/watch?v=${lesson.youtube_video_id}`
          }));

          if (videos.length > 0) {
            coursesWithLessons[course.title] = videos;
          }
        } catch (lessonError) {
          console.error(`[useCourses] Error fetching lessons for course ${course.id}:`, lessonError);
        }
      }

      console.log('[useCourses] Courses loaded successfully:', Object.keys(coursesWithLessons));
      setCourses(coursesWithLessons);
      setError(null);
    } catch (err: any) {
      console.error('[useCourses] Error fetching courses:', err);
      setError(err.response?.data?.error || 'Failed to load courses');
      setCourses({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (enabled) {
      fetchCoursesAndLessons();
    } else {
      setLoading(false);
      setCourses({});
    }
  }, [enabled]);

  return { courses, loading, error, refetch: fetchCoursesAndLessons };
}
