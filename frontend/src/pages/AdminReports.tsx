import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Download, FileText } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type CatalogBook = {
  title: string;
  description?: string;
  isbn?: string;
  status?: string;
  publisher?: string;
  year?: string | number;
};

type PopularBook = {
  rank: number;
  title: string;
  author: string;
  isbn: string;
  borrowCount: number;
  totalCopies: number;
  availableCopies: number;
};

type LibrarianRank = {
  rank: number;
  name: string;
  email: string;
  approvedCount: number;
};

type FeedbackItem = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  rating: number;
  status: string;
  createdAt: string;
};

type FeedbackSummary = {
  total: number;
  averageRating: number;
  statusBreakdown: Array<{ status: string; count: number }>;
  subjectBreakdown: Array<{ subject: string; count: number }>;
  ratingBreakdown: Array<{ rating: number; count: number }>;
};

type CatalogReportPayload = {
  period: string;
  generatedAt: string;
  totalBooks: number;
  books: CatalogBook[];
  popularBooks: PopularBook[];
  librarianRanking: LibrarianRank[];
  feedbackSummary: FeedbackSummary;
  feedbacks: FeedbackItem[];
};

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const humanizeLabel = (value: string) =>
  value.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const renderBars = (
  items: Array<{ label: string; value: number }>,
  color: string,
  emptyLabel: string,
) => {
  if (!items.length) {
    return `<p class="empty">${escapeHtml(emptyLabel)}</p>`;
  }

  const max = Math.max(...items.map((item) => item.value), 1);
  return items
    .map((item) => {
      const width = Math.max(4, Math.round((item.value / max) * 100));
      return `
      <div class="bar-row">
        <div class="bar-label">${escapeHtml(item.label)}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${width}%;background:${escapeHtml(color)}"></div>
        </div>
        <div class="bar-value">${item.value}</div>
      </div>
    `;
    })
    .join("");
};

const AdminReportsPage = () => {
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(false);

  const generateReportDownload = (data: CatalogReportPayload) => {
    const {
      books,
      period,
      generatedAt,
      totalBooks,
      popularBooks,
      librarianRanking,
      feedbackSummary,
      feedbacks,
    } = data;

    const popularBooksBars = renderBars(
      popularBooks.map((book) => ({
        label: `${book.rank}. ${book.title}`,
        value: Number(book.borrowCount || 0),
      })),
      "#0284c7",
      "No popular book data available.",
    );

    const librarianBars = renderBars(
      librarianRanking.map((librarian) => ({
        label: `${librarian.rank}. ${librarian.name}`,
        value: Number(librarian.approvedCount || 0),
      })),
      "#0f766e",
      "No librarian ranking data available.",
    );

    const feedbackSubjectBars = renderBars(
      (feedbackSummary?.subjectBreakdown || []).map((entry) => ({
        label: humanizeLabel(entry.subject || "unknown"),
        value: Number(entry.count || 0),
      })),
      "#7c3aed",
      "No feedback subject data available.",
    );

    const feedbackRatingBars = renderBars(
      (feedbackSummary?.ratingBreakdown || []).map((entry) => ({
        label: `${entry.rating} Star`,
        value: Number(entry.count || 0),
      })),
      "#f59e0b",
      "No rating distribution available.",
    );

    const feedbackStatusBars = renderBars(
      (feedbackSummary?.statusBreakdown || []).map((entry) => ({
        label: humanizeLabel(entry.status || "pending"),
        value: Number(entry.count || 0),
      })),
      "#16a34a",
      "No feedback status data available.",
    );

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>LibraXpert Admin Insights Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 32px; color: #0f172a; }
          .header { text-align: center; margin-bottom: 26px; border-bottom: 2px solid #0284c7; padding-bottom: 18px; }
          .header h1 { color: #0284c7; margin: 0; }
          .header h2 { margin: 10px 0 0; }
          .meta { margin: 14px 0 24px; font-size: 14px; color: #334155; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 12px 0 24px; }
          .summary-card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #f8fafc; }
          .summary-label { font-size: 12px; color: #475569; }
          .summary-value { font-size: 20px; font-weight: 700; margin-top: 4px; }
          .section { margin-top: 28px; page-break-inside: avoid; }
          .section h3 { margin: 0 0 10px; color: #0f172a; border-left: 4px solid #0284c7; padding-left: 8px; }
          .section h4 { margin: 14px 0 8px; color: #1e293b; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #0284c7; color: white; padding: 10px; text-align: left; font-weight: bold; font-size: 12px; }
          td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; vertical-align: top; }
          tr:nth-child(even) { background: #f8fafc; }
          .graph-box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #f8fafc; }
          .bar-row { display: grid; grid-template-columns: 210px 1fr 54px; gap: 10px; align-items: center; margin-bottom: 8px; }
          .bar-label { font-size: 12px; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .bar-track { background: #e2e8f0; border-radius: 9999px; height: 11px; overflow: hidden; }
          .bar-fill { height: 100%; border-radius: 9999px; }
          .bar-value { font-size: 12px; font-weight: 600; text-align: right; }
          .multi-graph { display: grid; grid-template-columns: 1fr; gap: 12px; }
          .empty { font-size: 12px; color: #64748b; margin: 0; }
          .feedback-message { max-width: 320px; white-space: normal; }
          .footer { margin-top: 36px; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>LibraXpert</h1>
          <h2>Admin Insights Report - ${escapeHtml(period.charAt(0).toUpperCase() + period.slice(1))}</h2>
        </div>
        <div class="meta">
          <p><strong>Generated:</strong> ${escapeHtml(new Date(generatedAt).toLocaleString())}</p>
          <p><strong>Period:</strong> ${escapeHtml(period === "all" ? "All Time" : period.charAt(0).toUpperCase() + period.slice(1))}</p>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-label">Catalog Books</div>
            <div class="summary-value">${Number(totalBooks || 0)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Popular Books Ranked</div>
            <div class="summary-value">${Number(popularBooks?.length || 0)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Total Feedback</div>
            <div class="summary-value">${Number(feedbackSummary?.total || 0)}</div>
          </div>
        </div>

        <div class="section">
          <h3>Popular 10 Books</h3>
          <div class="graph-box">
            ${popularBooksBars}
          </div>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Title</th>
                <th>Author</th>
                <th>Borrow Count</th>
                <th>Copies (Available/Total)</th>
              </tr>
            </thead>
            <tbody>
              ${(popularBooks || [])
                .map(
                  (book) => `
                <tr>
                  <td>${Number(book.rank || 0)}</td>
                  <td><strong>${escapeHtml(book.title)}</strong></td>
                  <td>${escapeHtml(book.author || "N/A")}</td>
                  <td>${Number(book.borrowCount || 0)}</td>
                  <td>${Number(book.availableCopies || 0)}/${Number(book.totalCopies || 0)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h3>Librarian Details (Ranking & Approved Numbers)</h3>
          <div class="graph-box">
            ${librarianBars}
          </div>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Email</th>
                <th>Approved Loans</th>
              </tr>
            </thead>
            <tbody>
              ${(librarianRanking || [])
                .map(
                  (librarian) => `
                <tr>
                  <td>${Number(librarian.rank || 0)}</td>
                  <td><strong>${escapeHtml(librarian.name)}</strong></td>
                  <td>${escapeHtml(librarian.email || "N/A")}</td>
                  <td>${Number(librarian.approvedCount || 0)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h3>Feedbacks (All)</h3>
          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-label">Total Feedback</div>
              <div class="summary-value">${Number(feedbackSummary?.total || 0)}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Average Rating</div>
              <div class="summary-value">${Number(feedbackSummary?.averageRating || 0).toFixed(2)}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Subjects Covered</div>
              <div class="summary-value">${Number(feedbackSummary?.subjectBreakdown?.length || 0)}</div>
            </div>
          </div>

          <div class="multi-graph">
            <div class="graph-box">
              <h4>Feedback by Subject</h4>
              ${feedbackSubjectBars}
            </div>
            <div class="graph-box">
              <h4>Feedback by Rating</h4>
              ${feedbackRatingBars}
            </div>
            <div class="graph-box">
              <h4>Feedback by Status</h4>
              ${feedbackStatusBars}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Subject</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Message</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${(feedbacks || [])
                .map(
                  (feedback) => `
                <tr>
                  <td>${escapeHtml(feedback.name || "Anonymous")}</td>
                  <td>${escapeHtml(feedback.email || "N/A")}</td>
                  <td>${escapeHtml(humanizeLabel(feedback.subject || "other"))}</td>
                  <td>${Number(feedback.rating || 0)}</td>
                  <td>${escapeHtml(humanizeLabel(feedback.status || "pending"))}</td>
                  <td class="feedback-message">${escapeHtml(feedback.message || "")}</td>
                  <td>${escapeHtml(new Date(feedback.createdAt).toLocaleDateString())}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h3>Catalog Snapshot</h3>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>ISBN</th>
              <th>Status</th>
              <th>Publisher</th>
              <th>Year</th>
            </tr>
          </thead>
          <tbody>
            ${books
              .map(
                (book) => `
              <tr>
                <td><strong>${escapeHtml(book.title || "Untitled")}</strong></td>
                <td>${escapeHtml(book.description || "N/A")}</td>
                <td>${escapeHtml(book.isbn || "N/A")}</td>
                <td><span style="text-transform: capitalize;">${escapeHtml(book.status || "unknown")}</span></td>
                <td>${escapeHtml(book.publisher || "N/A")}</td>
                <td>${escapeHtml(book.year || "N/A")}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        </div>

        <div class="footer">
          <p>LibraXpert - Advanced Library Management System • Admin Insights Export</p>
          <p>© ${new Date().getFullYear()} All Rights Reserved</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-insights-report-${period}-${new Date().toISOString().split("T")[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("libraxpert_token");
      const response = await fetch(
        `${API_URL}/reports/catalog-report?period=${period}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) throw new Error("Failed to generate report");

      const data: CatalogReportPayload = await response.json();
      generateReportDownload(data);

      toast({
        title: "Report Downloaded",
        description:
          "Admin insights report downloaded with popular books, librarian ranking, and feedback graphs.",
      });
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 animate-fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-library-500 via-library-600 to-library-700 bg-clip-text text-transparent">
          Reports
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Generate and download catalog reports for different time periods.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Admin Insights Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Period</label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleDownload}
            disabled={loading}
            className="w-full bg-library-600 hover:bg-library-700"
          >
            <Download className="h-4 w-4 mr-2" />
            {loading ? "Generating..." : "Download Full Admin Report"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReportsPage;
