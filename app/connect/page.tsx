import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Connect() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-400 to-blue-500 p-8">
      <h1 className="text-4xl font-bold text-white mb-8">Connect with Friends</h1>
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Add a Friend</h2>
        <form className="flex items-center space-x-2">
          <Input type="text" placeholder="Enter friend's username" className="flex-grow" />
          <Button type="submit">Add</Button>
        </form>
      </div>
    </div>
  );
}

