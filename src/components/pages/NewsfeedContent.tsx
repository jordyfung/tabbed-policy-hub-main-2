import NewsfeedFeed from '@/components/pages/newsfeed/NewsfeedFeed';
import NewsfeedChat from '@/components/pages/newsfeed/NewsfeedChat';

interface NewsfeedContentProps {
  activeSubTab?: string;
}

export default function NewsfeedContent({ activeSubTab = 'feed' }: NewsfeedContentProps) {
  const renderContent = () => {
    switch (activeSubTab) {
      case 'feed':
        return <NewsfeedFeed />;
      case 'chat':
        return <NewsfeedChat />;
      default:
        return <NewsfeedFeed />;
    }
  };

  return renderContent();
}