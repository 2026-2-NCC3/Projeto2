package com.example.projetopi;

import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONException;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Comparator;
import java.util.UUID;

/** Snapshots completos, imutaveis e publicados por rename. Nunca recebe credenciais. */
public final class SnapshotStore {
    public static final class Snapshot {
        public final JSONArray data;
        public final long updatedAt;
        Snapshot(JSONArray data,long updatedAt) {this.data=data;this.updatedAt=updatedAt;}
    }
    private final File root;
    public SnapshotStore(File root) {this.root=root;}
    private static String hash(String value) {
        try {
            byte[] bytes=MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder result=new StringBuilder();for(byte b:bytes) result.append(String.format("%02x",b&255));return result.toString();
        } catch(Exception e) {throw new IllegalStateException(e);}
    }
    private File directory(String owner) { if(owner==null || owner.isEmpty()) throw new IllegalArgumentException("Usuario obrigatorio"); return new File(root,hash(owner)); }
    public Snapshot read(String owner,String key,String kind) {
        synchronized(SnapshotStore.class) {
            File[] files=directory(owner).listFiles((dir,name)->name.startsWith(hash(key)+"-")&&name.endsWith(".json"));
            if(files==null) return null;
            Arrays.sort(files,Comparator.comparing(File::getName).reversed());
            for(File file:files) {
                if(file.length()>5_000_000) continue;
                try(InputStream input=new FileInputStream(file); ByteArrayOutputStream buffer=new ByteArrayOutputStream()) {
                    byte[] chunk=new byte[4096];int count;while((count=input.read(chunk))!=-1) buffer.write(chunk,0,count);
                    JSONObject envelope=new JSONObject(buffer.toString("UTF-8"));
                    if(envelope.getInt("format")!=1 || !owner.equals(envelope.getString("owner")) || !key.equals(envelope.getString("key"))) continue;
                    long time=envelope.getLong("updated_at");if(time<=0) continue;
                    return new Snapshot(ApiRecords.parse(envelope.getJSONArray("data").toString(),kind),time);
                } catch(Exception ignored) { /* Snapshot incompleto/corrompido nunca vira resposta real. */ }
            }
            return null;
        }
    }
    public Snapshot save(String owner,String key,String kind,String response,long now) throws IOException,JSONException {
        synchronized(SnapshotStore.class) {
            JSONArray data=ApiRecords.parse(response,kind);
            Snapshot previous=read(owner,key,kind);
            long time=Math.max(Math.max(1,now),previous==null?1:previous.updatedAt+1);
            File dir=directory(owner);if(!dir.isDirectory()&&!dir.mkdirs()) throw new IOException("Cache indisponivel");
            String prefix=hash(key)+"-";
            File temporary=File.createTempFile(prefix,".tmp",dir);
            File published=new File(dir,prefix+String.format("%019d",time)+"-"+UUID.randomUUID()+".json");
            try {
                JSONObject envelope=new JSONObject().put("format",1).put("owner",owner).put("key",key).put("updated_at",time).put("data",data);
                try(FileOutputStream output=new FileOutputStream(temporary)) {output.write(envelope.toString().getBytes(StandardCharsets.UTF_8));output.getFD().sync();}
                if(!temporary.renameTo(published)) throw new IOException("Nao foi possivel publicar cache");
                File[] old=dir.listFiles((d,name)->name.startsWith(prefix)&&name.endsWith(".json"));
                if(old!=null) for(File file:old) if(!file.equals(published)) file.delete();
                return new Snapshot(data,time);
            } finally {temporary.delete();}
        }
    }
    public void clear(String owner) {
        synchronized(SnapshotStore.class) {
            if(owner==null || owner.isEmpty()) return;
            File dir=directory(owner);File[] files=dir.listFiles();
            if(files!=null) for(File file:files) if(file.isFile()) file.delete();
            dir.delete();
        }
    }
}
