/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  BookOpen, 
  AlertCircle, 
  Clock, 
  Brain, 
  CheckCircle2, 
  TrendingUp, 
  Plus, 
  Trash2,
  Sparkles,
  ChevronRight,
  Target
} from 'lucide-react';
import { format, differenceInDays, addDays, isAfter } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';

// --- Types ---
interface StudyPlan {
  subjects: string[];
  weakTopics: string[];
  examDate: string;
  dailyHours: number;
}

interface SpacedRepetitionItem {
  topic: string;
  intervals: { day: number; date: Date }[];
}

// --- App Component ---
export default function App() {
  const [examDate, setExamDate] = useState<string>(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [subjects, setSubjects] = useState<string[]>(['Mathematics', 'Physics']);
  const [newSubject, setNewSubject] = useState('');
  const [weakTopics, setWeakTopics] = useState<string[]>(['Calculus', 'Quantum Mechanics']);
  const [newWeakTopic, setNewWeakTopic] = useState('');
  const [dailyHours, setDailyHours] = useState<number>(4);
  
  const [aiPlan, setAiPlan] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Logic ---
  const daysLeft = useMemo(() => {
    const diff = differenceInDays(new Date(examDate), new Date());
    return diff > 0 ? diff : 0;
  }, [examDate]);

  const readinessScore = useMemo(() => {
    // A simple heuristic for readiness
    // Base readiness on days left vs topics. 
    // More days = more time to prepare. More weak topics = less ready.
    const topicPenalty = weakTopics.length * 5;
    const timeBonus = Math.min(50, (daysLeft / 60) * 50);
    const score = Math.max(0, Math.min(100, 50 - topicPenalty + timeBonus));
    return Math.round(score);
  }, [daysLeft, weakTopics]);

  const spacedRepetitionSchedule = useMemo(() => {
    const intervals = [1, 3, 7, 14, 30];
    return weakTopics.map((topic, index) => ({
      topic,
      intervals: intervals.map(day => ({
        day,
        date: addDays(new Date(), day + index) // Stagger start dates to avoid overlap
      }))
    }));
  }, [weakTopics]);

  const handleAddSubject = () => {
    if (newSubject.trim()) {
      setSubjects([...subjects, newSubject.trim()]);
      setNewSubject('');
    }
  };

  const handleRemoveSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleAddWeakTopic = () => {
    if (newWeakTopic.trim()) {
      setWeakTopics([...weakTopics, newWeakTopic.trim()]);
      setNewWeakTopic('');
    }
  };

  const handleRemoveWeakTopic = (index: number) => {
    setWeakTopics(weakTopics.filter((_, i) => i !== index));
  };

  const generateAiPlan = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const prompt = `
        Act as an expert academic counselor. Create a highly personalized study plan for a student with the following details:
        - Exam Date: ${examDate} (${daysLeft} days remaining)
        - Subjects: ${subjects.join(', ')}
        - Weak Topics: ${weakTopics.join(', ')}
        - Daily Study Hours: ${dailyHours} hours

        Requirements:
        1. Provide a daily routine suggestion.
        2. Give specific strategies for the weak topics.
        3. Suggest a weekly mock test schedule.
        4. Ensure the schedule staggers the review of different topics so they don't all fall on the same day.
        5. Include motivational advice.
        
        Keep the tone encouraging and professional. Use Markdown for formatting.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
      });

      setAiPlan(response.text || "Failed to generate plan.");
    } catch (error) {
      console.error("Error generating AI plan:", error);
      setAiPlan("Error connecting to Gemini API. Please check your API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold tracking-tight text-slate-900 flex items-center gap-3"
            >
              <Brain className="w-10 h-10 text-indigo-600" />
              StudyFlow AI
            </motion.h1>
            <p className="text-slate-500 mt-2 text-lg">Your intelligent companion for exam success.</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <Calendar className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Days to Exam</p>
                <p className="text-2xl font-bold text-slate-800">{daysLeft}</p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-xl">
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Readiness</p>
                <p className="text-2xl font-bold text-slate-800">{readinessScore}%</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Inputs */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                Study Parameters
              </h2>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Exam Date</label>
                  <input 
                    type="date" 
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Daily Study Hours</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="16" 
                    value={dailyHours}
                    onChange={(e) => setDailyHours(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between mt-2 text-sm text-slate-500 font-medium">
                    <span>1h</span>
                    <span className="text-indigo-600 font-bold">{dailyHours} hours</span>
                    <span>16h</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Subjects</label>
                  <div className="flex gap-2 mb-3">
                    <input 
                      type="text" 
                      placeholder="Add subject..."
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()}
                      className="flex-1 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    />
                    <button 
                      onClick={handleAddSubject}
                      className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((s, i) => (
                      <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm flex items-center gap-2 border border-slate-200">
                        {s}
                        <button onClick={() => handleRemoveSubject(i)} className="text-slate-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Weak Topics</label>
                  <div className="flex gap-2 mb-3">
                    <input 
                      type="text" 
                      placeholder="Add topic..."
                      value={newWeakTopic}
                      onChange={(e) => setNewWeakTopic(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddWeakTopic()}
                      className="flex-1 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    />
                    <button 
                      onClick={handleAddWeakTopic}
                      className="p-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {weakTopics.map((t, i) => (
                      <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm flex items-center gap-2 border border-amber-100">
                        {t}
                        <button onClick={() => handleRemoveWeakTopic(i)} className="text-amber-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={generateAiPlan}
                disabled={isGenerating}
                className="w-full mt-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                Generate AI Strategy
              </button>
            </section>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8 space-y-8">
            {/* Spaced Repetition Schedule */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-indigo-500" />
                  Spaced Repetition Schedule
                </h2>
                <div className="flex flex-col items-end gap-1">
                  <div className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-widest">
                    Active Recall
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium italic">Staggered to prevent overlap</span>
                </div>
              </div>

              <div className="space-y-6">
                {spacedRepetitionSchedule.length > 0 ? (
                  spacedRepetitionSchedule.map((item, idx) => (
                    <div key={idx} className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-slate-400" />
                        {item.topic}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {item.intervals.map((interval, i) => (
                          <div key={i} className="flex flex-col items-center p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Day {interval.day}</span>
                            <span className="text-sm font-bold text-slate-700">{format(interval.date, 'MMM dd')}</span>
                            {isAfter(new Date(), interval.date) ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-2" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-slate-200 mt-2" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Add weak topics to generate a spaced repetition schedule.</p>
                  </div>
                )}
              </div>
            </section>

            {/* AI Personalized Plan */}
            <AnimatePresence mode="wait">
              {aiPlan && (
                <motion.section 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-indigo-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Sparkles className="w-32 h-32" />
                  </div>
                  
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 relative z-10">
                    <Brain className="w-7 h-7 text-indigo-300" />
                    Personalized AI Strategy
                  </h2>
                  
                  <div className="relative z-10">
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 markdown-body">
                      <Markdown>{aiPlan}</Markdown>
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* Weekly Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  Weekly Mock Test
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Based on your schedule, your next full-length mock test is recommended for 
                  <span className="font-bold text-indigo-600"> {format(addDays(new Date(), 7 - new Date().getDay()), 'EEEE, MMM dd')}</span>.
                </p>
                <div className="mt-4 p-4 bg-indigo-50 rounded-2xl flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-700 uppercase">Status</span>
                  <span className="text-xs font-bold text-indigo-400">Upcoming</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Priority Focus
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Focus on <span className="font-bold text-amber-600">{weakTopics[0] || 'your core subjects'}</span> today. 
                  Spend at least {Math.ceil(dailyHours * 0.4)} hours on active recall for this topic.
                </p>
                <button className="mt-4 text-indigo-600 text-xs font-bold flex items-center gap-1 hover:underline">
                  View Topic Breakdown <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
