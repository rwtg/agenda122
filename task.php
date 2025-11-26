<?php
class Task {
    private $conn;
    private $table_name = "tasks";

    public $id;
    public $user_id;
    public $title;
    public $description;
    public $completed;
    public $due_date;
    public $priority;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                 SET user_id=:user_id, title=:title, description=:description, 
                     due_date=:due_date, priority=:priority";
        
        $stmt = $this->conn->prepare($query);

        $this->title = htmlspecialchars(strip_tags($this->title));
        $this->description = htmlspecialchars(strip_tags($this->description));

        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":due_date", $this->due_date);
        $stmt->bindParam(":priority", $this->priority);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function readByUser() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE user_id = ? ORDER BY 
                 CASE 
                     WHEN due_date IS NULL THEN 1
                     ELSE 0
                 END,
                 due_date ASC, 
                 FIELD(priority, 'high', 'medium', 'low')";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->user_id);
        $stmt->execute();
        
        return $stmt;
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                 SET title=:title, description=:description, completed=:completed, 
                     due_date=:due_date, priority=:priority 
                 WHERE id=:id AND user_id=:user_id";
        
        $stmt = $this->conn->prepare($query);

        $this->title = htmlspecialchars(strip_tags($this->title));
        $this->description = htmlspecialchars(strip_tags($this->description));

        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":completed", $this->completed);
        $stmt->bindParam(":due_date", $this->due_date);
        $stmt->bindParam(":priority", $this->priority);
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":user_id", $this->user_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = ? AND user_id = ?";
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(1, $this->id);
        $stmt->bindParam(2, $this->user_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function toggleComplete() {
        $query = "UPDATE " . $this->table_name . " SET completed = :completed WHERE id = :id AND user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":completed", $this->completed);
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":user_id", $this->user_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>