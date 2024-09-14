import { NextResponse } from 'next/server';

const API_KEY = "AIzaSyCjFXFV_HATwGlZrvgedKnfndw_iSnlKRU";

const preferredChannelTitles = [
  'Chill Music Lab',
  // Add more preferred channel titles here
];

async function getChannelIdByTitle(channelTitle) {
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(channelTitle)}&key=${API_KEY}`;
  try {
    const response = await fetch(searchUrl);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch channel ID for title ${channelTitle}: ${errorText}`);
      throw new Error(`Failed to fetch channel ID for title ${channelTitle}`);
    }
    const data = await response.json();
    const channel = data.items[0];
    return channel?.id?.channelId;
  } catch (error) {
    console.error(`Error in getChannelIdByTitle: ${error.message}`);
    throw error;
  }
}

async function fetchVideosFromChannel(channelId) {
  const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${channelId}&part=snippet,id&order=date&maxResults=10`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch videos for channel ${channelId}: ${errorText}`);
      throw new Error(`Failed to fetch videos for channel ${channelId}`);
    }
    const data = await response.json();
    return data.items;
  } catch (error) {
    console.error(`Error in fetchVideosFromChannel: ${error.message}`);
    throw error;
  }
}

export async function GET() {
  try {
    const allVideos = [];

    for (const title of preferredChannelTitles) {
      const channelId = await getChannelIdByTitle(title);
      if (channelId) {
        const videos = await fetchVideosFromChannel(channelId);
        allVideos.push(...videos);
      }
    }

    allVideos.sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt));

    return NextResponse.json(allVideos);
  } catch (error) {
    console.error('Error in GET API route:', error.message);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}